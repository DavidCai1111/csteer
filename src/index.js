'use strict'
const cluster = require('cluster')
const {join} = require('path')
const {cpus} = require('os')
const log = require('n-log')

const CPU_NUM = cpus().length

module.exports = ({
  exec = null,
  args = process.argv.slice(2),
  instance = CPU_NUM,
  refork = true,
  limit = 60,
  duration = 60 * 1000,
  slient = false
} = {}) => {
  if (!cluster.isMaster) return

  let settings = {}
  if (exec && exec[0] !== '/') exec = join(process.cwd(), exec)
  if (exec) settings = {exec, args, slient}

  let timeLine = []
  let newWorker = {}
  let disconnectCount = 0
  let unexpectedExitCount = 0
  let disconnectedWorkersSet = new Set()

  cluster.on('disconnect', (worker) => {
    disconnectCount++
    // If the worker has already exited, do nothing
    if (worker.isDead && worker.isDead()) return
    disconnectedWorkersSet.add(worker.process.pid)

    if (shouldRefork()) newWorker = fork()
  })

  cluster.on('exit', (worker, code, signal) => {
    // If the worker has already disconnected, do nothing
    if (disconnectedWorkersSet.has(worker.process.pid)) {
      disconnectedWorkersSet.delete(worker.process.pid)
      return
    }

    unexpectedExitCount++
    if (shouldRefork()) newWorker = fork()
    cluster.emit('unexpectedExit', worker, code, signal)
  })

  for (let i = 0; i < instance; i++) {
    newWorker = fork()
    newWorker._clusterSettings = cluster.settings
  }

  setImmediate(() => {
    if (hasNoListener('uncaughtException')) cluster.on('uncaughtException', onerror)
    if (hasNoListener('unexpectedExit')) cluster.on('unexpectedExit', onUnexpected)
  })

  return cluster

  function shouldRefork () {
    if (refork !== true || limit === 0) return false
    if (limit === null) return true

    let timeLineLength = timeLine.push(Date.now())

    if (timeLineLength > limit) timeLine.shift()

    let start = timeLine[0]
    let end = timeLine[timeLineLength - 1]

    if (timeLineLength < limit || end - start > duration) return true

    cluster.emit('reachReforkLimit')
    return false
  }

  function fork () {
    if (settings) cluster.setupMaster(settings)
    return cluster.fork()
  }

  function hasNoListener (name) {
    return cluster.listeners(name).length === 0
  }

  function onerror (err) {
    if (!err) return
    log.error(Object.assign(err, {
      pid: process.pid,
      disconnectCount,
      unexpectedExitCount})
    )
  }

  function onUnexpected (worker, code, signal) {
    log.error(Object.assign(new Error('worker exit unexpectedly'), {
      state: worker.state,
      code: worker.process.exitCode,
      suicide: worker.suicide,
      signal
    }))
  }
}

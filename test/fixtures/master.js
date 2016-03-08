'use strict'
const join = require('path').join
const cpus = require('os').cpus
const log = require('n-log')
const csteer = require('../../lib')

csteer({
  exec: join(__dirname, './worker.js'),
  args: [ 3003 ],
  limit: cpus().length !== 1 ? cpus().length - 1 : 1,
  instance: cpus().length,
  duration: 60000
})
.on('fork', (worker) => {
  log.info({
    event: 'fork',
    pid: worker.process.pid
  })
})
.on('listening', (worker, address) => {
  log.info({
    event: 'listening',
    pid: worker.process.pid,
    port: address.port
  })
  process.send('listening')
})
.on('reachReforkLimit', () => {
  log.info('lol')
  process.send('reachReforkLimit')
})

process.once('SIGTERM', () => process.exit(0))

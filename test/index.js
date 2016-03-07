'use strict'
/*global describe, it, before, after*/
const fork = require('child_process').fork
const join = require('path').join
const cpus = require('os').cpus
const log = require('n-log')
const request = require('supertest')('http://localhost:3003')
const should = require('should')

describe('csteer test', () => {
  let messages = []
  let listeningCount = 0
  let child
  let cpuNum = cpus().length

  before((done) => {
    child = fork(join(__dirname, './fixtures/master.js'))
    child.on('message', (message) => {
      log.info(`get message: ${message}`)
      messages.push(message)
      if (message === 'listening') listeningCount += 1

      if (listeningCount === cpuNum && message === 'listening') done()
    })
  })

  after((done) => {
    setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(done, 1000)
    }, 2000)
  })

  it('workers should listening on the right port', (done) => {
    request.get('/data')
      .expect(200)
      .end(done)
  })

  it('workers should get error', (done) => {
    request.get('/error')
      .end((err) => {
        should.exist(err)
        done()
      })
  })

  it('workers should exit', (done) => {
    request.get('/exit')
      .end((err) => {
        should.exist(err)
        done()
      })
  })

  it('workers should all done', (done) => {
    let count = 0

    function check () {
      count += 1
      if (count === 4) done()
    }

    request.get('/error')
      .end((err) => {
        should.exist(err)
        check()
      })
    request.get('/error')
      .end((err) => {
        should.exist(err)
        check()
      })
    request.get('/error')
      .end((err) => {
        should.exist(err)
        check()
      })
    request.get('/error')
      .end((err) => {
        should.exist(err)
        check()
      })
    request.get('/error')
      .end((err) => {
        should.exist(err)
        check()
      })
  })

  it('should reach refork limit', (done) => {
    request.get('/exit')
      .end((err) => {
        should.exist(err)
        messages.indexOf('reachReforkLimit').should.not.eql(-1)
        done()
      })
  })
})

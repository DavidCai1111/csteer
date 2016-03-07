'use strict'
const http = require('http')
const port = Number(process.argv[2] || 3003)

http.createServer((req, res) => {
  if (req.url === '/error') throw new Error('jaja')
  if (req.url === '/exit') process.exit(0)

  res.end('hello world!')
}).listen(port)

require('../../lib')()

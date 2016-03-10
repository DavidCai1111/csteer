# csteer
[![Build Status](https://travis-ci.org/DavidCai1993/csteer.svg?branch=master)](https://travis-ci.org/DavidCai1993/csteer)

Run your app in cluster mode and refork it automatically when it was exit unexpectedly.

## Install

```
npm install csteer
```

## Usage

```js
'use strict'
const csteer = require('csteer')

csteer({
  exec: '/path/to/your/app',
  limit: 60,
  duration: 60 * 1000
})
.on('fork', (worker) => {
  console.log(`[${worker.process.pid}] worker start`)
})
.on('disconnect', (worker) => {
  console.warn(`[${worker.process.pid}] worker disconnect`)
})
.on('exit', (worker, code, signal) => {
  console.error(`[${worker.process.pid}] worker exit, code: ${code}, signal: ${signal}`)
})
.on('reachReforkLimit', () => {
  console.warn('lol')
})
```

## API

### csteer(options)

- options
  - exec (String) - path to your app
  - args (Array) - the arguments passing to the `exec`
  - instance(Number) - the number of workers which will be forked, by default it is `os.cpus().length`
  - limit(Number) - the times `csteer` will refork in `duration`, if it is set to be `null`, then there will be no limit, by default it is `60`
  - duration(Number) - by default it is `60000`

- return - the `cluster` object.

### Events

#### reachReforkLimit

Emitted when the times of refork over the `options.limit` in `options.duration` ms.

#### unexpectedExit

function (worker, code, signal) {}

Emitted when the worker process exit unexpectedly.

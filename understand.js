"use strict"

const signalExit = require('signal-exit')
const spawn = require('child_process').spawn
const coverageReport = 'text-lcov'
const nycBin = require.resolve('nyc/bin/nyc.js')
const node = process.execPath
const args = [nycBin, 'report', '--reporter', coverageReport]
let child, services

console.log("run.js\tpid: ", process.pid)
child = spawn(node, args, {
  stdio: ['ignore', 'pipe', 'pipe'],
})

child.stdout.on("data",
  (function() {
    let out = ''
    return output => {
      out += output
      if(/nyc\.js/g.test(out)) {
        console.log(out)
        child.stdout.pause()
        setTimeout(() => { process.exit() }, 1000)
      }
    }
  })()
)

// fiddle with these ;)
process.env.COVERALLS_REPO_TOKEN
process.env.CODECOV_TOKEN = true

services = [
  process.env.COVERALLS_REPO_TOKEN && {
    covBin: require.resolve('coveralls/bin/coveralls.js')
  , covName: 'Coveralls'
  }
, process.env.CODECOV_TOKEN && {
    covBin: require.resolve('codecov.io/bin/codecov.io.js')
  , covName: 'Codecov'
  }
].filter(x => !!x)

services.forEach(function(s) {
  const ca = spawn(node, [s.covBin], {
    stdio: [ 'pipe', 1, 2 ],
    env: process.env
  })
  child.stdout.pipe(ca.stdin)
  ca.on('close', function (code, signal) {
    if (signal)
      process.kill(process.pid, signal)
    else if (code)
      process.exit(code)
    else
      console.log('Successfully piped to ' + s.covName)
  })

  signalExit(function (code, signal) {
    child.kill('SIGHUP')
    ca.kill('SIGHUP')
  })
})

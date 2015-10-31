"use strict"

var spawn = require('child_process').spawn
var coverageReport = 'text-lcov'
var nycBin = require.resolve('nyc/bin/nyc.js')
var node = process.execPath
var args = [nycBin, 'report', '--reporter', coverageReport]
var child

console.log("run.js\tpid: ", process.pid)
child = spawn(node, args)

var services = [
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
  var ca = spawn(node, [s.covBin], {
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

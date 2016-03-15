var replicate = require('../')
var level = require('level')
var hyperlog = require('hyperlog')

var db = level(process.argv[2])
var log = hyperlog(db, { valueEncoding: 'json' })
replicate(log, 'outfile.tgz', function (err) {
  if (err) console.error(err)
  else console.log('ok')
})

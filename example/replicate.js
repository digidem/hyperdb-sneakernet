var replicate = require('../')
var hyperdb = require('hyperdb')

var db = hyperdb(process.argv[2], { valueEncoding: 'json' })
replicate(db, 'outfile.tgz', function (err) {
  if (err) console.error(err)
  else console.db('ok')
})

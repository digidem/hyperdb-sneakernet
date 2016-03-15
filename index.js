var hyperlog = require('hyperlog')
var tar = require('tar')
var fstream = require('fstream')
var fs = require('fs')
var path = require('path')
var tmpdir = require('os').tmpdir()
var onend = require('end-of-stream')
var once = require('once')
var gzip = require('zlib').createGzip
var gunzip = require('zlib').createGunzip
var pump = require('pump')

module.exports = function (log, opts, outfile, cb) {
  if (typeof opts === 'string') {
    cb = outfile
    outfile = opts
    opts = {}
  }
  if (!outfile) outfile = opts.file
  cb = once(cb || noop)

  var tmpfile = path.join(tmpdir, 'sneakernet-' + Math.random())
  var tgzfile = tmpfile + '.tgz'

  fs.stat(outfile, function (err, stat) {
    if (stat) {
      var r = fs.createReadStream(outfile)
      var unpack = tar.Extract({ path: tmpfile })
      pump(r, gunzip(), unpack)
        .once('error', cb)
        .on('end', function (err) {
          if (err) cb(err)
          else replicate()
        })
    } else replicate()
  })

  function replicate () {
    var dstlog = hyperlog(tmpfile, { valueEncoding: log.valueEncoding })
    var dr = dstlog.replicate()
    var lr = log.replicate()
    var pending = 2
    onend(dr, done)
    onend(lr, done)
    dr.pipe(lr).pipe(dr)
  }

  function done () {
    if (--pending !== 0) return
    var pack = tar.Pack()
    var r = fstream.Reader({ path: tmpfile, type: 'Directory' })
    pump(r, pack, gzip(), fs.createWriteStream(tgzfile))
      .once('error', cb)
      .once('end', rename)
  }
  function rename () {
    fs.rename(tgzfile, outfile, cb)
  }
}

function noop () {}

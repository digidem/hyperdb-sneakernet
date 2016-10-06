var hyperlog = require('hyperlog')
var level = require('level')
var tar = require('tar-fs')
var fs = require('fs')
var path = require('path')
var tmpdir = require('os').tmpdir()
var onend = require('end-of-stream')
var once = require('once')
var gzip = require('zlib').createGzip
var gunzip = require('zlib').createGunzip
var pump = require('pump')

module.exports = function (log, opts, outfile, cb_) {
  if (typeof opts === 'string') {
    cb_ = outfile
    outfile = opts
    opts = {}
  }
  if (!outfile) outfile = opts.file
  var xcb = cb_ || noop
  cb = once(function () {
    if (dstdb) dstdb.close()
    xcb.apply(this, arguments)
  })

  var tmpfile = path.join(tmpdir, 'sneakernet-' + Math.random())
  var tgzfile = tmpfile + '.tgz'
  var dstdb = level(tmpfile)

  var pending = 2

  fs.stat(outfile, function (err, stat) {
    if (stat) {
      pump(
        fs.createReadStream(outfile),
        gunzip(),
        tar.extract(tmpfile),
        function (err) {
          if (err) return cb(err)
          replicate()
        })
    } else replicate()
  })

  function replicate () {
    var dstlog = hyperlog(dstdb, { valueEncoding: log.valueEncoding })
    var dr = dstlog.replicate()
    var lr = log.replicate()
    onend(dr, done)
    onend(lr, done)
    dr.pipe(lr).pipe(dr)
  }

  function done () {
    if (--pending !== 0) return

    pump(
      tar.pack(tmpfile),
      gzip(),
      fs.createWriteStream(tgzfile),
      function (err) {
        if (err) return cb(err)
        rename()
      })
  }

  function rename () {
    fs.rename(tgzfile, outfile, cb)
  }
}

function noop () {}

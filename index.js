var hyperlog = require('hyperlog')
var level = require('level')
var tar = require('tar-fs')
var fs = require('graceful-fs')
var path = require('path')
var tmpdir = require('os').tmpdir()
var onend = require('end-of-stream')
var once = require('once')
var gzip = require('zlib').createGzip
var gunzip = require('zlib').createGunzip
var pump = require('pump')

module.exports = function (log, opts, outFile, cb_) {
  if (typeof opts === 'string') {
    cb_ = outFile
    outFile = opts
    opts = {}
  }
  if (!outFile) outFile = opts.file
  var xcb = cb_ || noop
  cb = once(function () {
    if (dstdb) dstdb.close()
    xcb.apply(this, arguments)
  })

  var tmpFile = path.join(tmpdir, 'sneakernet-' + Math.random())
  var tgzFile = tmpFile + '.tgz'
  var dstdb = null
  var existing = false

  var pending = 2

  fs.stat(outFile, function (err, stat) {
    if (err && err.code !== 'ENOENT') {
      return cb(err)
    }
    if (stat) {
      existing = true
      pump(
        fs.createReadStream(outFile),
        gunzip(),
        tar.extract(tmpFile),
        function (err) {
          if (err) return cb(err)
          replicate()
        })
    } else replicate()
  })

  function replicate () {
    dstdb = level(tmpFile)
    var dstlog = hyperlog(dstdb, { valueEncoding: log.valueEncoding })
    var dr = dstlog.replicate()
    var lr = log.replicate()
    onend(dr, doneReplication)
    onend(lr, doneReplication)
    dr.pipe(lr).pipe(dr)
  }

  function doneReplication (err) {
    if (err) {
      return cb(err)
    }
    if (--pending !== 0) return

    dstdb.close(function () {
      pump(
        tar.pack(tmpFile),
        gzip(),
        fs.createWriteStream(tgzFile),
        function (err) {
          if (err) return cb(err)
          rename()
        })
    })
  }

  function rename () {
    if (!existing) {
      copyFileToMedia()
    } else if (!opts.safetyFile) {
      fs.unlink(outFile, copyFileToMedia)
    } else {
      var tmpRemoteFile = outFile + ('' + Math.random()).substring(2, 7)
      fs.rename(outFile, tmpRemoteFile, function (err) {
        if (err) return cb(err)
        cp(tgzFile, outFile, function (err) {
          if (err) return cb(err)
          fs.unlink(tmpRemoteFile, cb)
        })
      })
    }
    function copyFileToMedia (err) {
      if (err) return cb(err)
      cp(tgzFile, outFile, cb)
    }
  }
}

function noop () {}

function cp (src, dst, cb) {
  pump(fs.createReadStream(src), fs.createWriteStream(dst), cb)
}

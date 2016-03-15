var replicate = require('../')
var level = require('level')
var hyperlog = require('hyperlog')

var db = level('log.db')
var log = hyperlog(db, { valueEncoding: 'json' })
replicate(log, '/media/usb/log.tgz')

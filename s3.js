var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')
var mkdirp = require('mkdirp')
var uuid = require('node-uuid'),
var AWS = require('aws-sdk')

AWS.config.update({accessKeyId: global.Config.aws.accessKeyId, secretAccessKey: global.Config.aws.secretAccessKey, region: global.Config.aws.region});

var s3 = new AWS.S3({region: global.Config.aws.s3BucketRegion});

function getFilename (req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

function S3Storage (opts) {
  this.getFilename = (opts.filename || getFilename)

  if (typeof opts.destination === 'string') {
    mkdirp.sync(opts.destination)
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

S3Storage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var outStream = fs.createWriteStream(finalPath)
      var key = uuid.v4();
      var params = {Bucket: ('dev-indifi-uploads' || global.Config.aws.s3BucketName), Key: key , Body: file.stream};
      var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
      s3.upload(params, options, function(err, data) {
        if(err) {
          return null;
        } else {
          return {
          'key': params.Key,
          'url': 'https://' + params.Bucket + '.s3.amazonaws.com/' + params.Key
        }
        }
      });
      // file.stream.pipe(outStream)
      // outStream.on('error', cb)
      // outStream.on('finish', function () {
      //   cb(null, {
      //     destination: destination,
      //     filename: filename,
      //     path: finalPath,
      //     size: outStream.bytesWritten
      //   })
      // })

    })
  })
}

S3Storage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

S3Storage.prototype.uploadFile =  function(stream, fileName, bucketName, applicationId, owner, contentType) {
    
    var key = finalPath;
    var params = {Bucket: ('dev-indifi-uploads' || global.Config.aws.s3BucketName), Key: key , Body: file.stream};
    var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
    s3.upload(params, options, function(err, data) {
      if(err) {
        return deferred.reject(err);
      } else {
        return deferred.resolve({
        'key': params.Key,
        'url': 'https://' + params.Bucket + '.s3.amazonaws.com/' + params.Key
      })
      }
    });
    return deferred.promise;
  },

module.exports = function (opts) {
  return new S3Storage(opts)
}

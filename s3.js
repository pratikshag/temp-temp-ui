var AWS = require('aws-sdk')
var uuid = require('node-uuid')

AWS.config.update({accessKeyId: global.Config.aws.accessKeyId, secretAccessKey: global.Config.aws.secretAccessKey, region: global.Config.aws.region});

var s3 = new AWS.S3({region: global.Config.aws.s3BucketRegion});



function S3Storage (opts) {
  console.log(opts)
  this.options = opts;
}


S3Storage.prototype._handleFile = function _handleFile (req, file, cb) {
  console.log(this)
  var self = this;
  var filename = self.options.filename || uuid.v4();
  if(self.options.destination == null){
    return cb(err)
  }
  var params = {Bucket: (self.options.destination), Key: filename , Body: file.stream};
  var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
  s3.upload(params, options, function(err, data) {
    if(err) {
      cb(err)
    } else {
      cb(null, { 
      'filename' : filename,
      'path' : filename,
      'destination': self.options.destination,
      'storage' : 's3'
    })
    }
  })
}

S3Storage.prototype._removeFile = function _removeFile (req, file, cb) {
  cb(null)
}


module.exports = function (opts) {
  console.log(opts)
  return new S3Storage(opts)
}

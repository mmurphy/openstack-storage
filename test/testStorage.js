var path = require('path');
var assert = require('assert');
var async = require('async');

var authenticate = require('../lib/authenticate');
var storage = require('../lib/storage');

suite('StorageTests', function(){
  var configFile;
  var config;
  var authFn;

  setup(function(done){
    configFile = path.join(__dirname,'../config/testconfig.json');
    path.exists(configFile, function (configPresent) {
      var err;
      if (configPresent) {
        config = require(configFile);
        authFn = async.apply(authenticate.getTokens, config);
      } else {
        err = new Error('config file: ' + configFile + ' not found. Did you create one based on the sample provided?');
      }
      done(err);
    });        
  });

  suite('Create Container, then file, then delete both', function(){
    test('happy test', function(done){
      var storageSwift = new storage.OpenStackStorage (authFn, function(err, res, tokens) {
        assert(!err);
        assert(tokens);
        async.waterfall(
          [
            function(cb) {
              var containerName = "EngTest";
              cb(null, containerName);
            },
            function(containerName, cb) {
              storageSwift.createContainer(containerName, function (err, statusCode) {
                assert(!err, "error creating container");
                assert(statusCode, "no statusCode");
                assert((statusCode>=200) && (statusCode<300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              storageSwift.addFile(containerName, {remoteName:'file1.png', localFile:'./test.png'}, function(err, statusCode) {
                assert(!err, "error sending file");
                assert(statusCode, "no statusCode");
                assert((statusCode>=200) && (statusCode<300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              storageSwift.deleteFile(containerName, 'file1.png', function (err, statusCode) {
                assert(!err, "error deleting file");
                assert(statusCode, "no statusCode");
                assert((statusCode>=200) && (statusCode<300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              storageSwift.deleteContainer(containerName, function (err, statusCode) {
                assert(!err, "error deleting container");
                assert(statusCode, "no statusCode");
                assert((statusCode>=200) && (statusCode<300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            }
          ],
          function(err, containerName) {
            assert(!err, "Previous asserts have succeeded, unexpected error: " + (err?err.toString():""));
            assert.strictEqual(containerName, "EngTest", "waterfall parameter sequence broken");
            done();
          }
        );
      });
    });
  });
});


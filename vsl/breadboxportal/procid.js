/* eslint-env node */
'use strict';

var log = require('loglevel');
log.setLevel(process.env.loglevel || 'debug');

var util = require('util');

var cfenv = require('cfenv');

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var cookieParser = require('cookie-parser');
var session = require('express-session');

function unwrap(wrapped) {
  if (util.isArray(wrapped) && wrapped.length > 0) {
    wrapped = wrapped[0];
  }
  return wrapped;
}

var jwt = require('jsonwebtoken');

function processuser(options, cb) {

   var profile = {"id":"jessejes@example.com","_json":{"given_name":"Jesse","family_name":"JES"}};

// log.debug('new options 1: %j', options);

options = options || {};

log.debug('new options 2: %j', options);

var userDb = require('./userDb.js')(options.cloudantCredentials);

userDb.updateVslUser(unwrap(profile.id), unwrap(profile._json.given_name)+" "+unwrap(profile._json.family_name)).then(
function() {
var token = jwt.sign({}, options.sharedSecret, {
expiresIn: '12h',
subject: unwrap(profile.id),
issuer: 'breadbox'
});
cb(token);
});

options.app.get('/auth/callback', function(req, res) {
  processuser(options, function(bigtoken) {log.debug('bigtoken: %s', bigtoken);
               res.redirect('/index.html?access_token=' + bigtoken);});
});
};

module.exports = processuser;

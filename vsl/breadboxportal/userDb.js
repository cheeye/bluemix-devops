/* eslint-env node */
'use strict';

var log = require('loglevel');
log.setLevel(process.env.loglevel || 'debug');

module.exports = function(cloudantCredentials, passwordKey) {

  var cloudant = require('cloudant')({
    account: cloudantCredentials.username,
//    account: "7e7dd452-5b07-43be-ba6a-9950c85ca954-bluemix",
    password: cloudantCredentials.password
//    password: "705c46064b60a82f5abfcc453acd157db1366d4e813730b1506d143c3eaf2a23"
  });
//  var userDb = cloudant.use(process.env.usersDb);
  var userDb = cloudant.use('users');

  var crypto = require('crypto');

  function decrypt(s) {
    var decipher = crypto.createDecipher('aes-256-ctr', passwordKey.secret);
    var decrypted = decipher.update(s, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  function sapUser(user) {
    return new Promise(function(resolve, reject) {
      userDb.find({
        selector: {
          ibmid: user
        }
      }, function(err, body) {
        if (err) {
          log.warn('userDb.find returned: %j', err);
          reject(err);
          return;
        }
        log.debug('userDb.find returned: %j', body);
        if (body.docs && body.docs.length === 1) {
          resolve({
            user: body.docs[0].sap_user,
            password: decrypt(body.docs[0].sap_pwd),
            company: body.docs[0].sap_company
          });
        } else if (body.docs && body.docs.length > 1) {
          log.warn('userDb.find found multiple matches for: %s', user);
          reject('Too many matches for user');
        } else {
          log.warn('userDb.find did not find: %s', user);
          reject('User not found');
        }
      });
    });
  }

  function vslUser(user) {
    return new Promise(function(resolve, reject) {
      userDb.find({
        selector: {
          ibmid: user
        }
      }, function(err, body) {
        if (err) {
          log.warn('userDb.find returned: %j', err);
          reject(err);
          return;
        }
        log.debug('userDb.find returned: %j', body);
        if (body.docs && body.docs.length === 1) {
          resolve({
            _id: user,
            customerid: body.docs[0].customerid,
            realname: body.docs[0].realname,
            breadpoints: body.docs[0].breadpoints
          });
        } else if (body.docs && body.docs.length > 1) {
          log.warn('userDb.find found multiple matches for: %s', user);
          reject('Too many matches for user');
        } else {
          log.warn('userDb.find did not find: %s', user);
          reject('User not found');
        }
      });
    });
  }

  function updateVslUser(user, name) {
    log.debug('updateUser: user: %j', user);
    return new Promise(function(resolve, reject) {
      userDb.find({
        selector: {
          ibmid: user
        }
      }, function(err, body) {
        if (err) {
          log.warn('userDb.find returned: %j', err);
          reject(err);
          return;
        }
        log.debug('userDb.get: body: %j', body);
        if (body.docs && body.docs.length === 1) {
          var doc = body.docs[0];
          doc.realname = name;
          doc.breadpoints = doc.breadpoints + 1;
          log.debug('userDb.insert: doc: %j', doc);
          userDb.insert(doc, function(err1) {
            if (err1) {
              log.warn('userDb.insert returned: %j', err1);
              reject(err1);
              return;
            }
            resolve();
          });
        } else if (body.docs && body.docs.length > 1) {
          log.warn('userDb.find found multiple matches for: %s', user);
          reject('Too many matches for user');
        } else {
          log.warn('userDb.find did not find: %s', user);
          reject('User not found');
        }
      });
    });
  }

  return {
    sapUser: sapUser,
    vslUser: vslUser,
    updateVslUser: updateVslUser
  };
}

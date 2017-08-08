/* eslint-env node */
'use strict';

var log = require('loglevel');
log.setLevel(process.env.loglevel || 'debug');

var appEnv = require('cfenv').getAppEnv();
var services = appEnv.getServices();
log.debug('services: %j', services);

var breadboxCredentials = JSON.parse(process.env.JWT_SHARED_SECRET);
log.debug('breadboxCredentials: %j', breadboxCredentials);

var cloudantCredentials = services.cloudantconfig.credentials;
log.debug('cloudantCredentials: %j', cloudantCredentials);
 
var express = require('express');
var app = express();

app.enable('trust proxy');
app.use(function(req, res, next) {
  if (req.secure || process.env.DEV) {
    // request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
});

var bodyParser = require('body-parser');
app.use(bodyParser.json());

var passport = require('passport');
var JwtBearerStrategy = require('passport-http-jwt-bearer');

app.use(passport.initialize());

passport.use(new JwtBearerStrategy(
    breadboxCredentials.secret,
  function(token, done) {
    log.debug('handleToken');
    log.debug('token: %j', token);
    var user = token.sub;
    if (user !== 'breadbox@breadbox.com') {
      return done('User: ' + user + ' not authorized');
    }
    return done(null, user, token);
  }
));

var cloudant = require('cloudant')({
        account: cloudantCredentials.username,
        password: cloudantCredentials.password
});
 
//var recDb = cloudant.use(process.env.recDb);
var recDb = cloudant.use('rec');

var request = require('request');

var analyzer = require('./analyzer.js');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

function saveRecommendations(key, value) {
  recDb.get(key, {}, function(err, body) {
    if (!err) {
      // Update a record, rather than a new record
      body.recom = value;
      recDb.insert(body, function(err2) {
        if (err2) {
          log.warn(
            'Unexpected error from the database updating a recommendation: %j',
            err2);
        } else {
          log.debug('Updated recommendations for %s', key);
        }
      });
    } else {
      if (err.statusCode === 404) {
        recDb.insert({
          _id: key.toString(),
          recom: value
        }, function(err2) {
          if (err2) {
            log.warn(
              'Unexpected error from the database creating a recommendation: %j',
              err2);
          } else {
            log.debug('Created recommendations for %s', key);
          }
        });
      } else {
        log.warn(
          'Unexpected return code getting recommendations from DB %j',
          err);
      }
    }
  });
}

app.post('/analyze-history', passport.authenticate('jwt-bearer', {
    session: false
  }),
  function(req, res) {
    var customerid = req.body.customerid;
    log.debug('/analyze-history: customerid: %j', customerid);

    if (!customerid) {
      res.status(400).send();
      return;
    }
    var options = {
      url: 'https://api.us.apiconnect.ibmcloud.com/spbodieusibmcom-prod' +
          '/developer-contest/breadbox/customerHistory?customer_number=' +  
          customerid + '&request_date=2013-09-01',
 
      method: 'GET',
//      rejectUnauthorized: false,
      headers: {
        'x-ibm-client-id': '3d4c01db-f9e5-4fb8-9131-57d693d30b32',
        'x-ibm-client-secret': 'H7jM3gQ0aY7lT3bM8iX8sS3lU4sE3tI3eJ1mW5iV0gG8uY3uW2',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        }
    };

    request(options, function(err, response, body) {
      log.debug('request err: %j', err);
      log.debug('request response: %j', response);
      log.debug('request body: %j', body);

      if (err) {
        log.warn('Unexpected error calling service: %j', err);
        res.status(500).send();
      } else {
        res.status(202).send();
        analyzer.analyze(JSON.parse(body), function(err2, results) {
          var recs = [];
          log.debug('Results: %j', results);
          for (var j in results.recom) {
            var weeksOld = parseInt(j) + 2;
            var rec = {
              'id': results.recom[j].ca_product_num,
              'name': results.recom[j].ca_product_name,
              'reason': 'You last bought this ' + weeksOld +
                ' weeks ago and may need more.'
            };
            if (weeksOld === 3) {
              rec.reason =
//                'You last bought this 1 month ago and may need more.';
                'On Sale this week!!!';
            }
            recs.push(rec);
          }
          log.debug('recs: %j', recs);
          saveRecommendations(results.customerid, recs);
        });
      }
    });
  });

app.get('/', function(req, res) {
  res.status(200).send('Breadbox Recommendation Service is running');
});

// Starting the server
const port = 'PORT' in process.env ? process.env.PORT : 8080;
app.listen(port, function () {
        const address = (this.address().address === '::') ? 'localhost' : this.address().address;
        const port = this.address().port;
//        console.log(`Example app listening on ${address}:${port}`)
        log.info('Breadbox Recommendation Service listening at https://%s:%s', address, port);
});

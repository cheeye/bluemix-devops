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

var userDb = require('./userDb.js')(cloudantCredentials);

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
		return done(null, user, token);
	}
));

var jwt = require('jsonwebtoken');

var cloudant = require('cloudant')({
	account: cloudantCredentials.username,
	password: cloudantCredentials.password
});

//var vslDb = cloudant.use(process.env.vslDb);
var vslDb = cloudant.use('vsl');
//var recDb = cloudant.use(process.env.recDb);
var recDb = cloudant.use('rec');

var request = require('request');
//var recsServer = process.env.RECS_SERVER;
var recsServer = 'vsl-rec-ws.mybluemix.net';

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
	next();
});

function createRecs(customerid) {
	log.debug('createRecs: customerid %s', customerid);
	if (!recsServer) {
		log.warn('createRecs: skipping');
		return;
	}
	var token = jwt.sign({}, breadboxCredentials.secret, {
//		expiresInSeconds: 5,
		expiresIn: 5,
		subject: 'breadbox@breadbox.com',
		issuer: 'breadbox'
	});
	var options = {
		url: 'https://' + recsServer + '/analyze-history',
		method: 'POST',
                rejectUnauthorized: false,
		headers: {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + token
		},
		json: {
			'customerid': customerid
		}
	};

	log.debug('options: %j', options);
	request(options, function(err) {
		if (err) {
			log.error('Error calling recs server: %j', err);
		}
	});
}

function getList(user) {
	return new Promise(function(resolve, reject) {
		vslDb.get(user, {}, function(err, body) {
			if (!err) {
				resolve(body);
			} else {
				if (err.statusCode === 404) {
					var result = {
						_id: user,
						list: []
					};
					resolve(result);
				} else {
					reject(err);
				}
			}
		});
	});
}

app.get('/shoppingList', passport.authenticate('jwt-bearer', {
	session: false
}), function(req, res) {

	log.debug('GET shopping list for %s', req.user);
	getList(req.user).then(function(doc) {
		log.debug('Shopping list %j', doc);
		res.status(200).json(doc);
	}, function(err) {
		log.warn('Unexpected error: %j', err);
		res.status(err.statusCode).send('Failed to get the shopping list: ' + err
			.reason);
	});
});

app.put('/shoppingList', passport.authenticate('jwt-bearer', {
	session: false
}), function(req, res) {

	log.debug('Update shopping list for %s', req.user);
	log.debug('Updated list is: %j', req.body.list);
	if (req.body.list) {
		getList(req.user).then(function(doc) {
			doc.list = req.body.list;
			vslDb.insert(doc, function(err, body) {
					if (!err) {
						log.debug('Shopping list %j', body);
						res.status(202).send(body);
					} else {
						log.warn('Unexpected error: %j', err);
						res.status(err.statusCode).send('Failed to save the shopping list: ' +
							err.reason);
					}
				},
				function(err) {
					res.status(err.statusCode).send('Failed to save the shopping list: ' +
						err.reason);
				});
		});
	} else {
		res.status(400).send(
			'No list was found.  Be sure to set your content type to application/json'
		);
	}
});

app.get('/recommendationList', passport.authenticate('jwt-bearer', {
	session: false
}), function(req, res) {

	log.debug('GET recommendation list for ' + req.user);
	userDb.vslUser(req.user).then(function(detail) {
		recDb.get(detail.customerid, {}, function(err, doc) {
			if (!err) {
				log.debug('Recommendation list %j', doc);
				res.status(200).json(doc);
			} else {
				if (err.statusCode === 404) {
					var result = {
						key: detail.customerid,
						recom: []
					};
					log.debug('Recommendation list %j', result);
					res.status(200).json(result);
				} else {
					log.warn('Unexpected error: %j', err);
					res.status(err.statusCode).send(
						'Failed to get the recommendation list: ' + err.reason);
				}
			}
		});
	});
});

app.get('/userDetail', passport.authenticate('jwt-bearer', {
	session: false
}), function(req, res) {

	log.debug('Get detail for user: %s', req.user);
	userDb.vslUser(req.user).then(function(detail) {
		log.debug('User details %j', detail);
		res.status(200).json(detail);
		createRecs(detail.customerid);
	}, function(err) {
		log.warn('Unexpected error: %j', err);
		res.status(err.statusCode).send('Failed to retrieve the user: ' + err.reason);
	});
});

app.get('/', function(req, res) {
	res.status(200).send('Breadbox List Service is running');
});

// Starting the server
const port = 'PORT' in process.env ? process.env.PORT : 8080;
app.listen(port, function () {
        const address = (this.address().address === '::') ? 'localhost' : this.address().address;
        const port = this.address().port;
//        console.log(`Example app listening on ${address}:${port}`)
        log.info('Breadbox List Service listening at https://%s:%s', address, port);
});

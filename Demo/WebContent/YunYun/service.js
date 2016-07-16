var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var url = require('url');
var datastore = require('./datastore');
var message = require('./message');
var app = express();

app.use(express.static(path.join(__dirname, 'web')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/user/register', function(req, res){
	var account = req.body.account;
	var password = req.body.password;

	if (typeof(account) == 'string' && account != '' && typeof(password) == 'string' && password != '') {
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		password = md5.update(password).digest('base64');

		datastore.register(account, password, function(status) {
			if (status) {
				res.json({success: true, operationTimes: Date.now()});
			} else {
				res.json({success: false, operationTimes: Date.now()});
			}
		});
	} else {
		res.json({success: false, operationTimes: Date.now()});
	}
});

app.post('/user/login', function(req, res){
	var account = req.body.account;
	var password = req.body.password;

	if (typeof(account) == 'string' && account != '' && typeof(password) == 'string' && password != '') {
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		password = md5.update(password).digest('base64');

		datastore.login(account, password, function(sessionId) {
			if (sessionId) {
				res.json({success: true, object: sessionId, operationTimes: Date.now()});
			} else {
				res.json({success: false, operationTimes: Date.now()});
			}
		});
	} else {
		res.json({success: false, operationTimes: Date.now()});
	}
});

app.get('/user/query', function(req, res){
	var sessionId = req.query.sessionId;
	if (typeof(sessionId) == 'string' && sessionId != '') {
		datastore.checkSessionId(sessionId, function(status) {
			if (status) {
				datastore.queryAll(function(accounts) {
					res.json({success: true, object: accounts, operationTimes: Date.now()});
				});
			} else {
				res.json({success: false, message: message.types['sessionId-expired'], operationTimes: Date.now()});
			}
		});
	} else {
		res.json({success: false, message: message.types['sessionId-undefined'], operationTimes: Date.now()})
	}
});

app.listen(80);
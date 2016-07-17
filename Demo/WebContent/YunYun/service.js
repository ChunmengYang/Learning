// schedule start
var schedule = require('./schedule');
schedule.setDayOfWeekJob();
schedule.setDateJob();
// schedule end

// service start
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var url = require('url');
var datastore = require('./datastore');
var errorcode = require('./errorcode');

var app = express();

app.use(express.static(path.join(__dirname, 'web')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

function checkSessionId(sessionId, res, callback) {
	if (typeof(sessionId) == 'string' && sessionId != '') {
		datastore.Account.checkSessionId(sessionId, function(status) {
			if (status) {
				(typeof callback === 'function') && callback();
			} else {
				res.json({success: false, errorCode: errorcode.types['sessionId-expired'], operationTimes: Date.now()});
			}
		});
	} else {
		res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()})
	}
}

app.post('/user/register', function(req, res){
	var account = req.body.account;
	var password = req.body.password;

	if (typeof(account) == 'string' && account != '' && typeof(password) == 'string' && password != '') {
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		password = md5.update(password).digest('base64');

		datastore.Account.register(account, password, function(status) {
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

		datastore.Account.login(account, password, function(sessionId) {
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

	checkSessionId(sessionId, res, function() {
		datastore.Account.queryAll(function(accounts) {
			res.json({success: true, object: accounts, operationTimes: Date.now()});
		});
	});
});

app.post('/goods/add', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var goods = req.body.goods;
		if (typeof(goods) === 'object') {
			datastore.Goods.add(goods, function(status) {
				res.json({success: status, operationTimes: Date.now()});
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});

app.post('/goods/update', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var goods = req.body.goods;
		if (typeof(goods) === 'object' && goods._id) {
			datastore.Goods.update(goods, function(status) {
				res.json({success: status, operationTimes: Date.now()});
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});

app.post('/goods/queryById', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var goodsId = req.body.goodsId;
		if (typeof(goodsId) === 'string' && goodsId !== '') {
			datastore.Goods.queryById(goodsId, function(goods) {
				var status = !!goods;

				res.json({success: status, object: goods, operationTimes: Date.now()});
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});

app.post('/goods/query', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var where = req.body.where;
		var sort = req.body.sort;
		var limt = req.body.limt;
		var pageIndex = req.body.pageIndex;

		datastore.Goods.query(where, sort, limt, pageIndex, function(result) {
			res.json(result);
		});
	});
});

app.listen(80);
// service end
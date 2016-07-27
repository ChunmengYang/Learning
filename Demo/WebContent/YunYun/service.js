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
var querystring = require('querystring');
var datastore = require('./datastore');
var errorcode = require('./errorcode');
var formidable = require('formidable');
var fs = require('fs');
var app = express();

app.use(express.static(path.join(__dirname, 'web')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

function tryParseJSON (str) {
	try {
		return JSON.parse(str);
	} catch(e) {
		console.log("tryParseJSON:=====" + str);
		return null;
	}
}

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

app.post('/user/update', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var user = req.body.user;
		if (typeof(user) === 'string') {
			user = tryParseJSON(user);
		}
		if (typeof(user) === 'object' && user._id) {
			datastore.Account.updateUser(user, function(status) {
				res.json({success: status, operationTimes: Date.now()});
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});

app.post('/goods/add', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var goods = req.body.goods; 
		if (typeof(goods) === 'string') {
			goods = tryParseJSON(goods);
		}
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
		if (typeof(goods) === 'string') {
			goods = tryParseJSON(goods);
		}
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
		if (typeof(where) === 'string') {
			where = tryParseJSON(where);
		}
		var sort = req.body.sort;
		if (typeof(sort) === 'string') {
			sort = tryParseJSON(sort);
		}
		var limit = req.body.limit;
		if (typeof(limit) === 'string') {
			limit = parseInt(limit);
		}
		var pageIndex = req.body.pageIndex;
		if (typeof(pageIndex) === 'string') {
			pageIndex = parseInt(pageIndex);
		}

		datastore.Goods.query(where, sort, limit, pageIndex, function(result) {
			var status = !!result;

			res.json({success: status, object: result, operationTimes: Date.now()});
		});
	});
});


app.post('/file/upload', function(req, res){
	var args = url.parse(req.originalUrl).query;
	var sessionId = querystring.parse(args).sessionId; 
	
	checkSessionId(sessionId, res, function() {
		var form = new formidable.IncomingForm();
		form.encoding = 'utf-8';
		form.uploadDir = 'attachment';
		form.keepExtensions = true;	
		form.maxFieldsSize = 4 * 1024 * 1024;

		form.parse(req, function(err, fields, files) {
			if (err) {
			  res.json({success: false, errorCode: errorcode.types['file-upload-error'], operationTimes: Date.now()});
			  return;
			}

			var attachment = {
				name: files.file.name,
				type: files.file.type,
				path: files.file.path,
				size: files.file.size
			};
			datastore.Attachment.add(attachment, function(attachmentId) {
				var status = !!attachmentId;
				res.json({success: status, object: attachmentId, operationTimes: Date.now()});
			});
		});
	});
});

app.get('/file/download', function(req, res){
	var sessionId = req.query.sessionId;

	checkSessionId(sessionId, res, function() {
		var attachmentId = req.query.attachmentId;
		if (typeof(attachmentId) === 'string' && attachmentId !== '') {
			datastore.Attachment.queryById(attachmentId, function(attachment) {
				if (attachment && attachment.path) {
					res.sendFile(path.join(__dirname, attachment.path));
				} else {
					res.json({success: false, errorCode: errorcode.types['file-not-found'], operationTimes: Date.now()});
				}
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});



app.post('/order/add', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		datastore.Account.queryUserBySessionId(sessionId, function(user) {
			if (user && user._id) {
				var userId = user._id;
				var goodsId = req.body.goodsId; 
				var count = req.body.count;
				if (typeof(count) === 'string') {
					count = parseInt(count);
				}
				if (typeof(goodsId) === 'string' && goodsId !== '' && count > 0) {
					datastore.Order.add(userId, goodsId, count, function(status) {
						res.json({success: status, operationTimes: Date.now()});
					});
				} else {
					res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
				}
			} else {
				res.json({success: false, errorCode: errorcode.types['user-not-found'], operationTimes: Date.now()});
			}
		});
	});
});

app.post('/order/queryById', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		var orderId = req.body.orderId;

		if (typeof(orderId) === 'string' && orderId !== '') {
			datastore.Order.queryById(orderId, function(order) {
				var status = !!order;
				res.json({success: status, object: order, operationTimes: Date.now()});
			});
		} else {
			res.json({success: false, errorCode: errorcode.types['params-undefined'], operationTimes: Date.now()});
		}
	});
});

app.post('/order/queryMine', function(req, res){
	var sessionId = req.body.sessionId;
	checkSessionId(sessionId, res, function() {
		datastore.Account.queryUserBySessionId(sessionId, function(user) {
			if (user && user._id) {
				var userId = user._id;
				
				var limit = req.body.limit;
				if (typeof(limit) === 'string') {
					limit = parseInt(limit);
				}
				var pageIndex = req.body.pageIndex;
				if (typeof(pageIndex) === 'string') {
					pageIndex = parseInt(pageIndex);
				}

				datastore.Order.queryUserOrder(userId, limit, pageIndex, function(result) {
					var status = !!result;

					res.json({success: status, object: result, operationTimes: Date.now()});
				});
			} else {
				res.json({success: false, errorCode: errorcode.types['user-not-found'], operationTimes: Date.now()});
			}
		});
	});
});

app.listen(80);
// service end
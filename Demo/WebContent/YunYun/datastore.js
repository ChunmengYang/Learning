var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');
  // Connection URL
var url = 'mongodb://localhost:27017/yunyun';

var Account = {
	__TABLE_NAME_ACCOUNT: 'Account',
	__TABLE_NAME_SESSION: 'Session',

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    register(account, password, callback) {
    	var tableName = this.__TABLE_NAME_ACCOUNT;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({account: account}, {}, function(err, user) {
				assert.equal(err, null);

				if (user) {
					db.close();
					(typeof callback === 'function') && callback(false);
				} else {
					collection.insertOne({account: account, password: password, createTime: Date.now(), modifyTime: Date.now()}, {}, function(err, r) {
					    assert.equal(err, null);
						assert.equal(1, r.insertedCount);

						db.close();
					    (typeof callback === 'function') && callback(true);
					});
				}
			});   
    	});
    },

    login(account, password, callback) {
    	var tableName = this.__TABLE_NAME_ACCOUNT;
    	var _this = this;

    	this.__connect(function(db) {
			var collection = db.collection(tableName);

	    	collection.findOne({account: account, password: password}, {}, function(err, user) {
				assert.equal(err, null);

				if (user) {
					db.close();
					_this.querySessionId(user._id, callback);
				} else {
					db.close();
					(typeof callback === 'function') && callback();
				}
			});    
    	});
    },

    querySessionId(accountId, callback) {
    	var tableName = this.__TABLE_NAME_SESSION;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var dateNow = Date.now();
			collection.findAndModify({accountId: accountId}, [], {$set: {sessionTime: dateNow, modifyTime: dateNow}}, function(err, result) {
				assert.equal(err, null);
				var status = result.ok;
				var sessionId = result.value ? result.value.sessionId : null;

				if (status === 1 && sessionId) {
					db.close();
					(typeof callback === 'function') && callback(sessionId);
				} else {
					var crypto = require('crypto');
					var md5 = crypto.createHash('sha1');
					sessionId = md5.update(accountId + Date.now()).digest('hex');
					
					collection.insertOne({accountId: accountId, sessionId: sessionId, sessionTime: dateNow, createTime: dateNow, modifyTime: dateNow}, {}, function(err, r) {
					    assert.equal(err, null);
						assert.equal(1, r.insertedCount);

						db.close();
					    (typeof callback === 'function') && callback(sessionId);
					});
				}
			});  
    	});
    },

    checkSessionId(sessionId, callback) {
    	var tableName = this.__TABLE_NAME_SESSION;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var dateNow = Date.now();
			collection.findAndModify({sessionId: sessionId}, [], {$set: {sessionTime: dateNow, modifyTime: dateNow}}, function(err, result) {
				assert.equal(err, null);
				console.log(result);

				var status = result.ok;
				sessionId = result.value ? result.value.sessionId : null;

				db.close();
				if (status === 1 && sessionId) {
					(typeof callback === 'function') && callback(sessionId);
				} else {
					(typeof callback === 'function') && callback();
				}
			});
    	});
    },

    removeExpiredSessionIds(callback) {
    	var tableName = this.__TABLE_NAME_SESSION;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var millisecond = Date.now();//Date.now() - 86400000;
	    	collection.findAndRemove({sessionTime: {$lt: millisecond}}, [], {}, function(err, result) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(result);
			});    
    	});
    }
};


var Goods = {
	__TABLE_NAME: 'Goods',

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    add(goods, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			goods.createTime = Date.now();
			goods.modifyTime = Date.now();
			collection.insertOne(goods, {}, function(err, r) {
			    assert.equal(err, null);
				var status = false;
				if (r.insertedCount === 1) {
					status = true
				}
				db.close();
			    (typeof callback === 'function') && callback(status);
			});
    	});
    },

    update(goods, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var goodsId = goods._id;
			var data = {
				modifyTime: Date.now()
			};
			for (var key in goods) {
				if (key !== '_id') {
					data[key] = goods[key];
				}
			}

	    	collection.updateOne({_id: ObjectID(goodsId)}, {$set: data}, {}, function(err, r) {
			    assert.equal(err, null);
				var status = false;
				if (r.modifiedCount === 1) {
					status = true
				}
				db.close();
			    (typeof callback === 'function') && callback(status);
			});
    	});
    },

    queryById(goodsId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({_id: ObjectID(goodsId)}, {}, function(err, goods) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(goods);
			});    
    	});
    },

    query(where, sort, limit, pageIndex, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);
			where = (typeof(where) === 'object') ? where : {};
			sort = (typeof(sort) === 'object') ? sort : {};
			limit = (typeof(limit) === 'number' && limit > 0) ? limit : 10;
			pageIndex = (typeof(pageIndex) === 'number' && pageIndex > 0) ? pageIndex : 1;

			var cursor = collection.find(where).sort(sort);

			cursor.count(function(err, count) {
				assert.equal(err, null);

				if (count > 0) {
					var pageCount = Math.floor(count / limit) + ((count % limit) ? 1 : 0);
					if (pageIndex > pageCount) {
						db.close();
						(typeof callback === 'function') && callback({items: [], pageCount: pageCount, pageIndex: pageIndex});
					} else {
						cursor.skip((pageIndex - 1) * limit).limit(limit).toArray(function(err, items) {
							assert.equal(err, null);

					      	db.close();
					      	(typeof callback === 'function') && callback({items: items, pageCount: pageCount, pageIndex: pageIndex});
					    });
					}
				} else {
					db.close();
					(typeof callback === 'function') && callback({items: [], pageCount: 0, pageIndex: pageIndex});
				}
		    })
    	});
    }
};

var Attachment = {
	__TABLE_NAME: 'Attachment',

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    add(attachment, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			attachment.createTime = Date.now();
			attachment.modifyTime = Date.now();
			collection.insertOne(attachment, {}, function(err, r) {
			    assert.equal(err, null);
			    assert.equal(r.insertedCount, 1);
				
				var attachmentId = r.insertedId;
				db.close();
			    (typeof callback === 'function') && callback(attachmentId);
			});
    	});
    },

    update(attachment, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var attachmentId = attachment._id;
			var data = {
				modifyTime: Date.now()
			};
			for (var key in attachment) {
				if (key !== '_id') {
					data[key] = attachment[key];
				}
			}

	    	collection.updateOne({_id: ObjectID(attachmentId)}, {$set: data}, {}, function(err, r) {
			    assert.equal(err, null);
				var status = false;
				if (r.modifiedCount === 1) {
					status = true
				}
				db.close();
			    (typeof callback === 'function') && callback(status);
			});
    	});
    },

    queryById(attachmentId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({_id: ObjectID(attachmentId)}, {}, function(err, attachment) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(attachment);
			});    
    	});
    }
};


var Groupon = {
	__TABLE_NAME: 'GrouponGoods',

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    }
};

/**
	status:
	1---提交订单
	2---取消订单
	3---已付款
	4---已完成
**/
var Order = {
	__TABLE_NAME: 'Order',
	STATUS_CONFIRM: 1,
	STATUS_CANCEL: 2,
	STATUS_PAID: 3,
	STATUS_COMPLETE: 4,

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    add(userId, goodsId, count, callback) {
    	var tableName = this.__TABLE_NAME;
    	var __this = this;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var order = {
				userId: userId,
				goodsId: goodsId,
				count: count,
				status: __this.STATUS_CONFIRM,
				createTime: Date.now(),
				modifyTime: Date.now()
			};
			collection.insertOne(order, {}, function(err, r) {
			    assert.equal(err, null);
				var status = false;
				if (r.insertedCount === 1) {
					status = true
				}
				db.close();
			    (typeof callback === 'function') && callback(status);
			});
    	});
    },

    pay(orderId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			var data = {
				modifyTime: Date.now(),
				status: __this.STATUS_PAID
			};

	    	collection.updateOne({_id: ObjectID(orderId)}, {$set: data}, {}, function(err, r) {
			    assert.equal(err, null);
				var status = false;
				if (r.modifiedCount === 1) {
					status = true
				}
				db.close();
			    (typeof callback === 'function') && callback(status);
			});
    	});
    },

    queryById(orderId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({_id: ObjectID(orderId)}, {}, function(err, order) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(order);
			});    
    	});
    },

    queryUserOrder(userId, limit, pageIndex, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);
			limit = (typeof(limit) === 'number' && limit > 0) ? limit : 10;
			pageIndex = (typeof(pageIndex) === 'number' && pageIndex > 0) ? pageIndex : 1;

			var cursor = collection.find({userId: userId}).sort({modifyTime: -1});

			cursor.count(function(err, count) {
				assert.equal(err, null);

				if (count > 0) {
					var pageCount = Math.floor(count / limit) + ((count % limit) ? 1 : 0);
					if (pageIndex > pageCount) {
						db.close();
						(typeof callback === 'function') && callback({items: [], pageCount: pageCount, pageIndex: pageIndex});
					} else {
						cursor.skip((pageIndex - 1) * limit).limit(limit).toArray(function(err, items) {
							assert.equal(err, null);

					      	db.close();
					      	(typeof callback === 'function') && callback({items: items, pageCount: pageCount, pageIndex: pageIndex});
					    });
					}
				} else {
					db.close();
					(typeof callback === 'function') && callback({items: [], pageCount: 0, pageIndex: pageIndex});
				}
		    })
    	});
    }
};

module.exports = {
	Account: Account,
	Goods: Goods,
	Attachment: Attachment,
	Groupon: Groupon,
	Order: Order
}
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
  // Connection URL
var url = 'mongodb://localhost:27017/yunyun';

var Account = {
	__TABLE_NAME: 'Account',

    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    register(account, password, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({account: account}, {}, function(err, user) {
				assert.equal(err, null);

				if (user) {
					db.close();
					(typeof callback === 'function') && callback(false);
				} else {
					collection.insertOne({account: account, password: password}, {}, function(err, r) {
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
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

	    	collection.findOne({account: account, password: password}, {}, function(err, user) {
				assert.equal(err, null);

				var sessionId = null;
				if (user) {
					if (user.sessionId) {
						sessionId = user.sessionId;
					} else {
						var crypto = require('crypto');
						var md5 = crypto.createHash('md5');
						sessionId = md5.update(account + Date.now()).digest('base64');
						collection.updateOne({_id: user._id},{$set: {sessionId: sessionId, sessionTime: Date.now()}}, {}, function(err, r) {
						    assert.equal(err, null);
						    assert.equal(1, r.modifiedCount);
						});
					}
				}
				db.close();
				(typeof callback === 'function') && callback(sessionId);
			});    
    	});
    },

    checkSessionId(sessionId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

	    	collection.findOne({sessionId: sessionId}, {}, function(err, user) {
				assert.equal(err, null);

				var hasSessionId = false
				if (user) {
					hasSessionId = true;
				}
				db.close();
				(typeof callback === 'function') && callback(hasSessionId);
			});    
    	});
    },

    removeExpiredSessionIds(callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);
			var millisecond = Date.now() - 86400000;
	    	collection.findAndModify({sessionTime: {$lt: millisecond}}, [], {$set: {sessionId: undefined, sessionTime: undefined}}, function(err, result) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(result);
			});    
    	});
    },

    queryAll(callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.find().toArray(function(err, accounts) {
				assert.equal(err, null);

				(typeof callback === 'function') && callback(accounts);
				db.close();
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

			collection.insertOne(goods, {}, function(err, r) {
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

    update(goods, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

	    	collection.updateOne({_id: goods._id},{$set: goods}, {}, function(err, r) {
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

    queryById(goodsId, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);

			collection.findOne({_id: goodsId}, {}, function(err, goods) {
				assert.equal(err, null);

				db.close();
				(typeof callback === 'function') && callback(goods);
			});    
    	});
    },

    query(where, sort, limt, pageIndex, callback) {
    	var tableName = this.__TABLE_NAME;
    	this.__connect(function(db) {
			var collection = db.collection(tableName);
			where = (typeof(where) === 'object') ? where : {};
			sort = (typeof(sort) === 'object') ? sort : {};
			limt = (typeof(limt) === 'number' && limt > 0) ? limt : 10;
			pageIndex = (typeof(pageIndex) === 'number' && pageIndex > 0) ? pageIndex : 1;

			var cursor = collection.find(where).sort(sort);

			cursor.count(function(err, count) {
				assert.equal(err, null);

				if (count > 0) {
					var pageCount = Math.floor(count / limt) + ((count % limt) ? 1 : 0);
					if (pageIndex > pageCount) {
						db.close();
						(typeof callback === 'function') && callback({items: [], pageCount: pageCount, pageIndex: pageIndex});
					} else {
						cursor.skip((pageIndex - 1) * limt).limit(limt).toArray(function(err, items) {
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
	Goods: Goods
}
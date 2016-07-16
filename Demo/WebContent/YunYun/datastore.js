var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
  // Connection URL
var url = 'mongodb://localhost:27017/yunyun';

var Datastore = {
    __connect(callback) {
    	// Use connect method to connect to the Server
		MongoClient.connect(url, function(err, db) {
		  assert.equal(null, err);
		  console.log("Connected correctly to server");

		  callback(db);
		}.bind(this));
    },

    register(account, password, callback) {
    	this.__connect(function(db) {
			var collection = db.collection('Account');

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
    	this.__connect(function(db) {
			var collection = db.collection('Account');

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
    	this.__connect(function(db) {
			var collection = db.collection('Account');

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

    queryAll(callback) {
    	this.__connect(function(db) {
    		var collection = db.collection('Account');

			collection.find().toArray(function(err, accounts) {
				assert.equal(err, null);

				(typeof callback === 'function') && callback(accounts);
				db.close();
			});      
    	});
    }
}

module.exports = Datastore;
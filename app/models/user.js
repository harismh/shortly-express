var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var bcryptPromise = Promise.promisifyAll(bcrypt);

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  
  initialize: function() {
    this.on('creating', function(model, attrs, option) {      
      return bcryptPromise.hashAsync(model.get('password'), null, null)
        .then(function(hash) {
          model.set('password', hash);
        });
    });
  },

  comparePassword: function(password, cb) {
    return bcryptPromise.compareAsync(password, this.get('password'))
      .then(function(res) {
        cb(res);
      });
  }
});

module.exports = User;
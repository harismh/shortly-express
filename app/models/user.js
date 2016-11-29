var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  
  initialize: function() {
    this.on('creating', function(model, attrs, option) {      
      bcrypt.hash(this.get('password'), null, null, function(err, hash) {
        if (err) {
          console.log('error in bcrypt');
          throw err;
        } else {
          model.set('password', hash);
        }
      });
    });
  }
});
 

module.exports = User;
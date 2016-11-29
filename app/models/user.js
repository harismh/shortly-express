var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  
  initialize: function() {
    this.on('creating', function(model, attrs, option) {      
    //   bcrypt.hashSync(this.get('password'), null, null, function(err, hash) {
    //     if (err) {
    //       console.log('error in bcrypt');
    //       throw err;
    //     } else {
    //       model.set('password', hash);
    //       console.log(model.get('password'));
    //     }
    //   });
    // });
      var hash = bcrypt.hashSync(model.get('password'));
      model.set('password', hash);
    });
  }
});

 

module.exports = User;
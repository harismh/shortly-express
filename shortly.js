var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(session({
  secret: 'shhhh, very secret',
  resave: false,
  saveUninitialized: true,
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', util.checkUser,
  function(req, res) {
    res.render('index');
  });

app.get('/create', util.checkUser, 
  function(req, res) {
    res.render('index');
  });

app.get('/links', util.checkUser, 
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  });

app.post('/links', util.checkUser,
  function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
          .then(function(newLink) {
            res.status(200).send(newLink);
          });
        });
      }
    });
  });
/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  if (req.session.user) {
    console.log('get login, yo already logged in');
    res.redirect('/');
  } else {
    res.render('login');
  }
});

app.post('/login', function(req, res) {
  var queryUsername = req.body.username;
  new User({username: queryUsername})
  .fetch()
  .then(function(found) {
    if (found) {
        // console.log('hey yo, you found username shortly.js', found);
      this.comparePassword(req.body.password, function (compare) {
        if (compare) {
          //create session
          req.session.regenerate(function() {
            req.session.user = req.body.username;
            res.status(200);
            res.redirect('/');
          });

        } else {
          res.redirect('/login');
        }
      });

    } else {
      res.redirect('/login');
      //prompt that username/password is incorrect
    }
  });
});
      //possible solution for proper funcationality
        // rl.question('Username/password does not exist. Create new account? [yes]/no: ', function(answer) {
        //   if (answer === 'yes') {
        //     res.redirect('/signup');
        //   } else {
        //     console.log('Screw you. Try again later');
        //   }
        // });
//});

app.get('/signup', function(req, res) {
  res.render('signup');
});


app.post('/signup', function(req, res) {
  new User({username: req.body.username})
  .fetch()
  .then(function(found) {
    if (found) {
      res.redirect('/login');
    } else {
      Users.create({
        username: req.body.username,
        password: req.body.password
      })
      .then(function() {
        //create session
        req.session.regenerate(function() {
          req.session.user = req.body.username;
          res.status(200);
          res.redirect('/');
        });

      });
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

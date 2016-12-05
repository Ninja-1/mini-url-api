var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var validator = require('validator');
var shortid = require('shortid');

var app = express();
var db;

MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
  db = database;

  var port = process.env.PORT || 8080;
  app.listen(port, function() {
    // running
  });
});

// middleware for incorrectly encoded parameters
app.use(function(req, res, next) {
  var url = req.url;
  if (url.indexOf('new') > -1 && url.indexOf(':') > -1) {
    var passedUrl = url.replace('/new/', '');
    passedUrl = encodeURIComponent(passedUrl);
    req.url = '/new/' + passedUrl;
  }
  next();
});

app.get('/', function(req, res) {
  res.status(200).send({
    'message': 'try /new/:url'
  });
});

app.get('/new/:url', function(req, res) {
  var url = decodeURIComponent(req.params.url);
  var shortUrl = shortid.generate();
  if (url && validator.isURL(url, { require_protocol: true })) {
    var urls = db.collection('urls');
    urls.insert({
      url: url,
      shortUrl: shortUrl
    }, function (err, result) {
      if (!err) {
        res.status(201).send({
          url: url,
          shortUrl: shortUrl
        });
      } else {
        res.sendStatus(500);
      }
    });
  } else {
    res.status(422).send({
      "error": "bad url"
    });
  }
});

app.get('/:url', function(req, res) {
  var url = req.params.url;
  var urls = db.collection('urls');
  urls.findOne({
    shortUrl: url
  }, function(err, doc) {
    if (!err && doc) {
      res.redirect(302, doc.url);
    } else {
      res.sendStatus(500);
    }
  })
});

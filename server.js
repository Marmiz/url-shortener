// import libraries
var express = require('express');
var app = express();
var router = express.Router();

var mongodb = require('mongodb');
var shortid = require('shortid');
// set some valid char
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

var validUrl = require('valid-url');

// mongoDB and mLab config
var config = require('./config');

// set port
app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/public'));

// set some db variables for mLAb
var mLab = "mongodb://" + config.db.host +"/" +config.db.name;
var MongoClient = mongodb.MongoClient;


/* GET home page. */
app.get('/', function(req, res, next) {
  res.sendFile('index.html');
});

/* GET new url. */
app.get('/new/:url(*)', function (req, res, next){
  console.log(req.params.url);
  
  // connect to the database
  MongoClient.connect(mLab, function (err, db) {
  if (err) {
    console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server");
    
      // set the db varaibles
      var collection = db.collection('links');
      var params = req.params.url;
      
      // set the local params
      var local = req.get('host') + "/";
    
      // create the function to import a link and return it short
      var newLink = function(db, callback) {
        
        /*  Check if the url passed already exist. If no create a new one  */
        collection.findOne({ "url": params }, { short: 1, _id: 0 }, function(err, doc){
          if (doc != null){
            res.json({ original_url: params, short_url: local + doc.short });
          } else {
            /* check if the url is valid, if so generate a short code and push a new object with it in the db.  */
            if (validUrl.isUri(params)) {
                var shortCode = shortid.generate();
                var newUrl = { url: params, short: shortCode };
                collection.insert([newUrl]);
                // console.log our insert.
                res.json({ original_url: params, short_url: local + shortCode });
            } else {
            res.json({ error: "Wrong url format, make sure you have a valid protocol and real site." });
            };
          };
        });
      };
      
      newLink (db, function(){
        db.close();
      });
    };
  });
});

/*  connect to short  */
app.get('/:short', function(req, res, next){
  
  // same connect functionality as /new
  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log("Unable to connect to server", err);
      } else {
      console.log("Connected to server")

      var collection = db.collection('links');
      var params = req.params.short;
      
      /*  Search in the database and return only the url. If exist redirect the user. */
      var findLink = function (db, callback) {
        collection.findOne({ "short": params }, { url:1, _id:0 }, function(err, doc){
          if (doc != null) {
            res.redirect(doc.url);
          } else{
            res.json({ error: "No matching link in our database." });
          }
          
        });
      };

      findLink(db, function () {
        db.close();
      });

    };
  });
});


// server functionality
app.listen(app.get('port'), function () {
  console.log(`Server listening on port ${app.get('port')}`);
});



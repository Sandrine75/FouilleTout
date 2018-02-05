var express = require('express');
var bodyParser = require("body-parser");
var ejs = require('ejs');
ejs.delimiter = '$';

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render('home');
});

app.get('/deposer', function(req, res) {
  res.render('formAdd');
})

app.get('/annonce/:id', function(req, res){
  res.render('showAd');
});

app.get("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

app.listen(3030, function() {
  console.log("Server is listening...");
});

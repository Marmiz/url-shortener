var express = require('express');
var app = express();

// set port
app.set('port', (process.env.PORT || 8080));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(app.get('port'), function () {
  console.log(`Server listening on port ${app.get('port')}`);
});
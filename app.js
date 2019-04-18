// Módulos

var express = require('express');
var app = express();
var swig = require('swig');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var crypto = require('crypto');
var gestorBD = require("./modules/gestorBD.js");
var expressSession = require('express-session');
var fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    var respuesta = swig.renderFile('views/index.html');
    res.send(respuesta);
});
gestorBD.init(app,mongo);

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));
require("./routes/rusuarios.js")(app, swig, gestorBD);

// Variables
app.set('port', 8081);
app.set('db','mongodb://admin:admin@mywallapop-shard-00-00-wvvdk.mongodb.net:27017,mywallapop-shard-00-01-wvvdk.mongodb.net:27017,mywallapop-shard-00-02-wvvdk.mongodb.net:27017/test?ssl=true&replicaSet=MyWallapop-shard-0&authSource=admin&retryWrites=true');
app.set('clave','abcdefg');
app.set('crypto',crypto);


app.use( function (err, req, res, next ) {
    console.log("Error producido: " + err); //we log the error in our db
    if (! res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});
app.use(express.static('public'));

// lanzar el servidor
app.listen(app.get('port'), function() {
    console.log("Servidor activo");
});
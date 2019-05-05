// Módulos
var express = require('express');
var app = express();
var mongo = require('mongodb');
var swig = require('swig');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var gestorBD = require("./modules/gestorBD.js");
var expressSession = require('express-session');
var fs = require('fs');
var https = require('https');
var jwt = require('jsonwebtoken');
var fileUpload = require('express-fileupload');


// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:admin@mywallapop-shard-00-00-wvvdk.mongodb.net:27017,mywallapop-shard-00-01-wvvdk.mongodb.net:27017,mywallapop-shard-00-02-wvvdk.mongodb.net:27017/test?ssl=true&replicaSet=MyWallapop-shard-0&authSource=admin&retryWrites=true');
app.set('clave', 'abcdefg');
app.set('crypto', crypto);
app.set('jwt', jwt);
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

var rest = require('request');
app.set('rest', rest);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});


//bbdd
gestorBD.init(app, mongo);

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function (req, res, next) {
    console.log("routerUsuarioSession");
    if (req.session.usuario) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : " + req.session.destination)
        res.redirect("/login");
    }
});
//Aplicar routerUsuarioSession
app.use("/catalogue", routerUsuarioSession);
app.use("/home", routerUsuarioSession);
app.use("/offer/add", routerUsuarioSession);

// routerUsuarioToken
var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    var token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {

        // verificar el token
        jwt.verify(token, 'secreto', function (err, infoToken) {
            if (err || (Date.now() / 1000 - infoToken.tiempo) > 1000) {
                res.status(403); // Forbidden
                res.json({
                    acceso: false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;

            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        res.status(403); // Forbidden
        res.json({
            acceso: false,
            mensaje: 'No hay Token'
        });
    }
});

// Aplicar routerUsuarioToken
app.use('/api/catalogue', routerUsuarioToken);
app.use('/api/conver*', routerUsuarioToken);
app.use('/api/chat*', routerUsuarioToken);




//routerUsuarioOfertas
var routerOfertas = express.Router();
routerOfertas.use(function (req, res, next) {
    console.log("routerOfertas");
    var path = require('path');
    var idOferta = path.basename(req.originalUrl);
    var criterio = {_id: mongo.ObjectID(idOferta)};
    gestorBD.obtenerOfertas(criterio, function (ofertas) {
        if (req.session.usuario != null && ofertas[0].owner == req.session.usuario) {
            next();
        } else {
            res.redirect("/login" + "?mensaje=Está intentando acceder a un recurso al que no está autorizado" +
                "&tipoMensaje=alert-danger ");
        }
    })
});
//Aplicar routerUsuarioOfertas
app.use("/offer/delete/*", routerOfertas);


//excepciones
app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); //we log the error in our db
    if (!res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});

//pantalla ppal
app.get('/', function (req, res) {
    var respuesta = swig.renderFile('views/index.html');
    res.send(respuesta);
});

//rutas
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rofertas.js")(app, swig, gestorBD);
require("./routes/rapichat.js")(app, swig, jwt, gestorBD);


//uso de public
app.use(express.static('public'));

//lanzar el servidor

https.createServer({
    key: fs.readFileSync('certificates/alice.key'),
    cert: fs.readFileSync('certificates/alice.crt')
}, app).listen(app.get('port'), function () {
    console.log("Servidor activo");
});
// app.listen(app.get('port'), function () {
//     console.log("Servidor activo");
// });
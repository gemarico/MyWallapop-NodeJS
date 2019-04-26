module.exports = function (app, swig, gestorBD) {
    app.get("/signup", function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {});
        res.send(respuesta);
    });

    app.get("/login", function (req, res) {
        var respuesta = swig.renderFile('views/login.html', {});
        res.send(respuesta);
    });

    app.get("/user/messagelist", function (req, res) {
        var userSesion = {email: req.session.usuario};
            gestorBD.obtenerUsuarios(userSesion, function (usuarios) {

                var respuesta = swig.renderFile('views/messagelist.html', {

                   usuario: usuarios[0]
                });
                res.send(respuesta);
            });
    });

    app.get("/user/list", function (req, res) {
            var criterio = {email: {$ne: "admin@email.com"}};
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                criterio = {email: "admin@email.com"};
                gestorBD.obtenerUsuarios(criterio, function (admin) {

                    var respuesta = swig.renderFile('views/userlist.html', {

                        usuarios: usuarios,
                        usuario: admin[0]
                    });
                    res.send(respuesta);
                });

            });
    });

    app.post('/user/delete', function (req, res) {
        var emails = req.body.emails;
        if(emails != null ){
        if (typeof (emails) == "string") {
            var criterio = {email: emails};
            var criterioOfertas = {owner: emails};

        } else {
            var criterio = {email: {$in: emails}};
            var criterioOfertas = {owner: {$in: emails}};

        }
        gestorBD.eliminarUsuario(criterio, function (result) {

            if (result == null)
                res.send("Error al borrar usuario/s");
            else {
                gestorBD.eliminarOferta(criterioOfertas, function (result) {
                    if (result == null) {
                        res.send("Error eliminando ofertas de usuario");
                    } else {
                        res.redirect("/user/list");
                    }
                });
            }
        });
        }
        else{
            res.redirect("/user/list" + "?mensaje=No se han seleccionado usuarios" +
                "&tipoMensaje=alert-danger ");
        }
    });

    app.get('/logout', function (req, res) {
        req.session.usuario = null;
        var respuesta = swig.renderFile('views/index.html', {});
        res.send(respuesta);
    });

    app.get("/home", function (req, res) {
        var criterio = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.send("Error al encontrar usuario");
            } else {
                criterio = {owner: req.session.usuario};
            }
            gestorBD.obtenerOfertas(criterio, function (ofertas) {
                if (ofertas == null) {
                    res.send("Error al encontrar ofertas");
                } else {
                    criterio = {buyer: req.session.usuario};
                    gestorBD.obtenerOfertas(criterio, function (ofertasP) {
                        if (ofertasP == null) {
                            res.send("Error al encontrar ofertas compradas");
                        } else {
                            var respuesta = swig.renderFile('views/home.html',
                                {
                                    usuario: usuarios[0],
                                    ofertasC: ofertas,
                                    ofertasP: ofertasP

                                });
                            res.send(respuesta);
                        }
                    });
                }
            });
        });
    });


    app.post('/signup', function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        var creditos = 100.0;
        var usuario = {
            email: req.body.email,
            name: req.body.name,
            lastName: req.body.lastName,
            password: seguro,
            credits: creditos,
            role: "client"
        }
        var criterio = {email: req.body.email};
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios.length > 0) {
                res.redirect("/signup" + "?mensaje=El email ya está registrado" +
                    "&tipoMensaje=alert-danger ");
            } else {

                if (req.body.password == req.body.password2) {

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/signup" + "?mensaje=Error al registrar usuario" +
                                "&tipoMensaje=alert-danger ");
                        } else {
                            res.redirect("/login?mensaje=Nuevo usuario registrado");
                        }
                    });
                } else {
                    res.redirect("/signup?mensaje=Las password no coinciden" +
                        "&tipoMensaje=alert-danger ");
                }
            }

        });
    });

    app.post("/login", function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        var criterio = {
            email: req.body.email,
            password: seguro
        }
        if (criterio.email == "admin@email.com") {
            criterio.password = req.body.password;
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/login" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0].email;
                res.redirect("/home");
            }
        });

    });

}
;
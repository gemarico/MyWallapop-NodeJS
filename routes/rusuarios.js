module.exports = function (app, swig, gestorBD, logger) {
    app.get("/signup", function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {});
        res.send(respuesta);
    });

    app.get("/login", function (req, res) {
        var respuesta = swig.renderFile('views/login.html', {});
        res.send(respuesta);
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
                logger.info("Admin ha accedido a la lista de usuarios del sistema");
                res.send(respuesta);
            });
        });
    });

    app.post('/user/delete', function (req, res) {
        var criterio;
        var criterioOfertas;
        var emails = req.body.emails;
        if (emails != null) {
            if (typeof (emails) == "string") {
                criterio = {email: emails};
                criterioOfertas = {owner: emails};

            } else {
                criterio = {email: {$in: emails}};
                criterioOfertas = {owner: {$in: emails}};

            }
            gestorBD.eliminarUsuario(criterio, function (result) {

                if (result == null) {
                    res.send("Error al borrar usuario/s");
                    logger.info("Error eliminando usuarios");
                } else {
                    gestorBD.eliminarOferta(criterioOfertas, function (result) {
                        if (result == null) {
                            logger.info("Error eliminando ofertas de usuario");
                            res.send("Error eliminando ofertas de usuario");
                        } else {
                            logger.info("Se han eliminado los usuarios " + emails + " correctamente");
                            res.redirect("/user/list");
                        }
                    });
                }
            });
        } else {
            logger.info("Intento de borrado sin usuarios seleccionados por parte del admin de MyWallapop");
            res.redirect("/user/list" + "?mensaje=No se han seleccionado usuarios" +
                "&tipoMensaje=alert-danger ");
        }
    });

    app.get('/logout', function (req, res) {
        logger.info(req.session.usuario + " ha cerrado sesión en MyWallapop");
        req.session.usuario = null;
        var respuesta = swig.renderFile('views/index.html', {});
        res.send(respuesta);
    });

    app.get("/home", function (req, res) {
        var criterio = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length === 0) {
                logger.info("Problemas al encontrar al usuario " + req.session.usuario);
                res.send("Error al encontrar usuario");
            } else {
                criterio = {owner: req.session.usuario};
            }
            gestorBD.obtenerOfertas(criterio, function (ofertas) {
                if (ofertas == null) {
                    logger.info("Problemas al encontrar las ofertas de " + req.session.usuario);
                    res.send("Error al encontrar ofertas");
                } else {
                    criterio = {buyer: req.session.usuario};
                    gestorBD.obtenerOfertas(criterio, function (ofertasP) {
                        if (ofertasP == null) {
                            logger.info("Problemas al encontrar las ofertas de " + req.session.usuario);
                            res.send("Error al encontrar ofertas compradas");
                        } else {
                            var respuesta = swig.renderFile('views/home.html',
                                {
                                    usuario: usuarios[0],
                                    ofertasC: ofertas,
                                    ofertasP: ofertasP

                                });
                            logger.info(req.session.usuario + " ha accedido a su área personal en MyWallapop");
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
        };
        if(req.body.email==="admin@email.com"){
            usuario.role="admin";
            usuario.credits = "NONE";
        }
        var criterio = {email: req.body.email};
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios.length > 0) {
                logger.info("Error al intento de registrar usuario. El usuario " + req.body.email + " ya está registrado");
                res.redirect("/signup" + "?mensaje=El email ya está registrado" +
                    "&tipoMensaje=alert-danger ");
            } else {

                if (req.body.password === req.body.password2) {

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            logger.info("Error al intento de registrar usuario " + req.body.email);
                            res.redirect("/signup" + "?mensaje=Error al registrar usuario" +
                                "&tipoMensaje=alert-danger ");
                        } else {
                            logger.info("Se ha registrado al nuevo usuario " + req.body.email);
                            res.redirect("/login?mensaje=Nuevo usuario registrado");
                        }
                    });
                } else {
                    logger.info("[passwords incorrectas] Error al intento de registrar usuario  " + req.body.email);
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
        };

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length === 0) {
                req.session.usuario = null;
                logger.info("Intento de autenticación incorrecta en MyWallapop");
                res.redirect("/login" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0].email;
                logger.info(req.session.usuario + " se ha autenticado en MyWallapop");
                res.redirect("/home");
            }
        });

    });

}
;
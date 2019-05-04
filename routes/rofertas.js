module.exports = function (app, swig, gestorBD) {
    app.get("/catalogue", function (req, res) {
        if (req.query.searchText != null) {
            var criterio = {
                $and: [{title: {$regex: ".*" + req.query.searchText + ".*", $options: "xi"}},
                    {owner: {$ne: req.session.usuario}}]
            };
        } else
            var criterio = {owner: {$ne: req.session.usuario}};
        var pg = parseInt(req.query.pg);
        if (req.query.pg == null)
            pg = 1;
        var userSesion = {email: req.session.usuario};
        gestorBD.obtenerUsuarios(userSesion, function (usuarios) {
            if (usuarios == null || usuarios.length == 0)
                res.send("Error al encontrar usuario");
            else {
                gestorBD.obtenerOfertasPg(criterio, pg, function (ofertas, total) {
                    if (ofertas == null)
                        res.send("Error al listar ");
                    else {
                        var ultimaPg = total / 4;
                        if (total % 4 > 0)
                            ultimaPg = ultimaPg + 1;
                        var paginas = [];
                        for (var i = pg - 2; i <= pg + 2; i++) {
                            if (i > 0 && i <= ultimaPg)
                                paginas.push(i);
                        }
                        var respuesta = swig.renderFile('views/catalogue.html',
                            {
                                ofertas: ofertas,
                                paginas: paginas,
                                usuario: usuarios[0],
                                actual: pg
                            });
                        res.send(respuesta);
                    }
                });
            }
        });
    });


    app.get("/offer/add", function (req, res) {
        var userSesion = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(userSesion, function (usuarios) {
            if (usuarios == null || usuarios.length == 0)
                res.send("Error al encontrar usuario");
            else {
                res.send(swig.renderFile('views/addOffer.html', {
                    usuario: usuarios[0]
                }));
            }
        });

    });


    app.post('/catalogue', function (req, res) {
        var offerid = {_id: gestorBD.mongo.ObjectID(req.body.buy)};
        var userSesion = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(userSesion, function (usuarios) {
            if (usuarios == null || usuarios.length == 0)
                res.send("Error al encontrar usuario");
            else {
                gestorBD.obtenerOfertas(offerid, function (ofertas) {
                    if (ofertas == null || ofertas.length == 0)
                        res.send("Error al encontrar oferta");
                    else {

                        if (usuarios[0].credits < ofertas[0].price) {
                            res.redirect("/catalogue" + "?mensaje=No tienes suficientes créditos" +
                                "&tipoMensaje=alert-danger ");
                        } else {
                            ofertas[0].buyer = userSesion.email;
                            ofertas[0].sold = true;
                            usuarios[0].credits = usuarios[0].credits - ofertas[0].price;
                            gestorBD.modificarOferta(offerid, ofertas[0], function (result) {
                                if (result == null) {
                                    res.send("Error en la modificación oferta");
                                } else {
                                    gestorBD.modificarUsuario(userSesion, usuarios[0], function (result) {
                                        if (result == null) {
                                            res.send("Error en la modificación usuario");
                                        } else {
                                            res.redirect("/catalogue" + "?mensaje=Oferta comprada");
                                        }
                                    });
                                }
                            });
                        }

                    }
                });
            }
        });
    });

    app.get('/offer/flash/:id', function (req, res) {
        var offerid = {_id: gestorBD.mongo.ObjectID(req.params.id)};
        var userSesion = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(userSesion, function (usuarios) {
            if (usuarios == null || usuarios.length == 0)
                res.send("Error al encontrar usuario");
            else {
                gestorBD.obtenerOfertas(offerid, function (ofertas) {
                    if (ofertas == null || ofertas.length == 0)
                        res.send("Error al encontrar oferta");
                    else {
                        if (ofertas[0].flash == true) {
                            ofertas[0].flash = false;
                        } else {
                            if (usuarios[0].credits < 20) {
                                res.redirect("/home" + "?mensaje=No tienes suficientes créditos" +
                                    "&tipoMensaje=alert-danger ");
                                return;
                            } else {
                                ofertas[0].flash = true;
                                usuarios[0].credits = usuarios[0].credits - 20;
                            }
                        }
                        gestorBD.modificarOferta(offerid, ofertas[0], function (result) {
                            if (result == null) {
                                res.send("Error en la modificación oferta");
                            } else {
                                gestorBD.modificarUsuario(userSesion, usuarios[0], function (result) {
                                    if (result == null) {
                                        res.send("Error en la modificación usuario");
                                    } else {
                                        res.redirect("/home" + "?mensaje=Oferta modificada");
                                    }
                                });
                            }
                        });
                    }

                });
            }
        });
    });


    app.post('/offer/add', function (req, res) {
        var userSesion = {email: req.session.usuario};
        var oferta = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            date: new Date(),
            owner: req.session.usuario,
            sold: false,
            buyer: "",
            flash: false
        }
        oferta.date.setMonth(oferta.date.getMonth() + 1);
        var usuario = null;
        if (req.body.flash == "a") {
            oferta.flash = true;
            gestorBD.obtenerUsuarios(userSesion, function (usuarios) {
                if (usuarios == null || usuarios.length == 0)
                    res.send("Error al encontrar usuario");
                else {
                    usuarios[0].credits = usuarios[0].credits - 20;
                    usuario = usuarios[0];
                }
            });
        }
        if (oferta.price >= 0) {
            gestorBD.insertarOferta(oferta, function (id) {
                if (id == null) {
                    res.redirect("/offer/add" + "?mensaje=Error al crear la oferta" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    gestorBD.modificarUsuario(userSesion, usuario, function (result) {
                        if (result == null) {
                            res.send("Error en la modificación usuario");
                        } else {
                            res.redirect("/home" + "?mensaje=Oferta añadida");
                        }
                    });
                }
            });
        } else {
            res.redirect("/offer/add" + "?mensaje=El precio debe ser positivo" +
                "&tipoMensaje=alert-danger ");
        }

    });

    app.get('/offer/delete/:id', function (req, res) {
        var criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarOferta(criterio, function (result) {
            if (result == null)
                res.send("Error al borrar oferta");
            else
                res.redirect("/home");
        });
    });


};
module.exports = function(app, swig, gestorBD) {
    app.get("/catalogue", function(req, res) {
        var respuesta = swig.renderFile('views/catalogue.html', {
            usuario : req.session.usuario
        });
        res.send(respuesta);
    });

    app.get("/offer/add", function(req, res) {
        var respuesta = swig.renderFile('views/addOffer.html', {
            usuario : req.session.usuario
        });
        res.send(respuesta);
    });

    app.post('/catalogue', function(req, res) {
        var criterio = { email : req.session.usuario };
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if ( usuarios.length > 0) {
                res.redirect("/signup"+ "?mensaje=El email ya está registrado"+
                    "&tipoMensaje=alert-danger ");
            } else {

                if (req.body.password == req.body.password2) {

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/signup"+ "?mensaje=Error al registrar usuario"+
                                "&tipoMensaje=alert-danger ");
                        } else {
                            res.redirect("/login?mensaje=Nuevo usuario registrado");
                        }
                    });
                } else {
                    res.redirect("/signup?mensaje=Las password no coinciden"+
                        "&tipoMensaje=alert-danger ");
                }
            }

        });
    });


    app.post('/offer/add', function(req, res) {

        var oferta = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            date : new Date(),
            owner: req.session.usuario
        }
        oferta.date.setMonth(oferta.date.getMonth()+1);
        if(oferta.price >=0){
        gestorBD.insertarOferta(oferta, function (id) {
                if (id == null) {
                    res.redirect("/offer/add"+ "?mensaje=Error al crear la oferta"+
                                "&tipoMensaje=alert-danger ");}
                else{
                    res.redirect("/home"+ "?mensaje=Oferta añadida");
                }
        });}
        else{
            res.redirect("/offer/add"+ "?mensaje=El precio debe ser positivo"+
                "&tipoMensaje=alert-danger ");
        }

    });

    app.get('/offer/delete/:id', function(req, res) {
        var criterio = {"_id" : gestorBD.mongo.ObjectID(req.params.id) };
        gestorBD.eliminarOferta(criterio,function(ofertas){
                res.redirect("/home");
        });
    });


};
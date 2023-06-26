


//to check the user is logged in or not
exports.isLoggedIn = (req,res,next)=>{
    if(req.session.user){
        next();
    }else{
        
        res.render('user/index');
    }
}

exports.isLogged = (req,res,next) => {
    if(req.session.user){
        res.redirect('/');
    }else{
        next();
    }
}


//For admin
//to check the admin is logged in or not
exports.isAdminLoggedIn = (req, res, next)=>{
    if(req.session.admin){
        next();
    }else{
        res.render('admin/login')
    }
}

exports.isAdminLogged = (req, res, next) =>{
    if(req.session.admin){
        res.redirect('/admin')
    }else{
        next();
    }
}
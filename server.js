if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  const path = require('path')
  const mysql = require('mysql');
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const bodyParser = require('body-parser');

  app.use(express.static(path.join(__dirname, 'public')));

  app.use(bodyParser.urlencoded({extended : true}));
  app.use(bodyParser.json());
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  


 

  const db_data = {
    host     : process.env.SQL_HOST,
    user     : process.env.SQL_USER,
    password : process.env.SQL_PASS,
      database : process.env.SQL_DB
  }

  const connection = mysql.createPool({ connectionLimit: 5,host     : process.env.SQL_HOST,
    user     : process.env.SQL_USER,
    password : process.env.SQL_PASS,
      database : process.env.SQL_DB }); 


  //PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET PASSPORT SET 
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    Getuser,
    Getuserbyid
  )
  //PASSPORT FUNCTION DATABASE           PASSPORT FUNCTION DATABASE        PASSPORT FUNCTION DATABASE         PASSPORT FUNCTION DATABASE
 function Getuser(email){
  return new Promise(function(resolve, reject) {
    connection.query('SELECT * FROM doctori WHERE EMAIL = ?',email, function(error, response, fields) {
     // console.log("---" +response[0]+"---")
       resolve(response[0]);
         });
    });
  }
  function Getuserbyid(id){
    return new Promise(function(resolve, reject) {
      connection.query('SELECT * FROM doctori WHERE ID = ?',id, function(error, response, fields) {
        if(error){ console.log(error);throw error;}
       // console.log("===" +response[0]+"===")
         resolve(response[0]);
           });
      });
}
  

  app.get('/',checkAuthenticated, (req, res) => {

    connection.query('SELECT postari.ID, NUME, PRENUME, SEX, NASTERE FROM postari INNER JOIN pacienti ON pacienti.ID=postari.ID_P WHERE postari.STATUS = "Inregistrata" ', function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        res.render('index.ejs',{posts:response})
      }
        });
  })

  app.get('/pacient',checkAuthenticated, (req, res) => {

    connection.query('SELECT * FROM postari INNER JOIN pacienti ON pacienti.ID=postari.ID_P WHERE postari.ID ='+req.query.id, function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        console.log(response);
        res.render('pacient.ejs',{user:response[0],id:req.query.id});
      }
        });
  })

  app.post('/reteta',checkAuthenticated,(req,res)=>{

    const update_post = {
      RETETA:req.body.reteta,
      STATUS:'Validata'
    }

    connection.query('UPDATE postari SET ? WHERE ID = '+req.body.id_postare ,update_post,function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        res.redirect('/');
      }
  });
  })
  

 
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })) 
  
  app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/myposts')
    }
    next()
  }

  
  app.listen(process.env.PORT||3001)
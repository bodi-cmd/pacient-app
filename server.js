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
  


  var connection = mysql.createConnection({
    // host     : process.env.SQL_HOST,
    // user     : process.env.SQL_USER,
    // password : process.env.SQL_PASS,
    //   database : process.env.SQL_DB
    host     : 'eu-cdbr-west-03.cleardb.net',
    user     : 'b36d7b62d710c8',
    password : '2e88abef',
    database : 'heroku_8b5e243ac7dedc4'
  });


  function handleDisconnect() {
    var connection = mysql.createConnection({
      host     : 'eu-cdbr-west-03.cleardb.net',
      user     : 'b36d7b62d710c8',
      password : '2e88abef',
      database : 'heroku_8b5e243ac7dedc4'
    }); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    connection.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  
  handleDisconnect();
















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
    connection.query('SELECT * FROM pacienti WHERE EMAIL = ?',email, function(error, response, fields) {
     // console.log("---" +response[0]+"---")
       resolve(response[0]);
         });
    });
  }
  function Getuserbyid(id){
    return new Promise(function(resolve, reject) {
      connection.query('SELECT * FROM pacienti WHERE ID = ?',id, function(error, response, fields) {
        if(error){ console.log(error);throw error;}
       // console.log("===" +response[0]+"===")
         resolve(response[0]);
           });
      });
}
  

  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  app.get('/myposts',checkAuthenticated, (req, res) => {
    //console.log(users.find(user => user.email === email))
    connection.query('SELECT * FROM postari WHERE ID_P = ?',req.user.ID,function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        res.render('myposts.ejs',{posts:response})
      }
  });
  })

  app.get('/myprofile',checkAuthenticated, (req, res) => {

    connection.query('SELECT * FROM pacienti WHERE ID = ?',req.user.ID,function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        res.render('profile.ejs',{user:response[0]})
      }
  });
  })
  app.post('/myprofile',checkAuthenticated,(req,res)=>{
    console.log("NUME ++ "+ req.body.nume)
    const update_user = {
        NUME:req.body.nume,
        PRENUME:req.body.prenume,
        ADRESA:req.body.adresa,
        EMAIL:req.body.email,
        TELEFON:req.body.telefon,
        NASTERE:req.body.birth,
        SEX:req.body.sex,
        VERIFICAT:1,
        DIAGNOSTICE:req.body.diagnostice
    }
    connection.query('UPDATE pacienti SET ? WHERE ID = '+req.user.ID,update_user,function(error, response, fields) {
      if(error){console.log(error);throw error;}
      else{
        res.redirect('/myprofile');
      }
  });
  })


  
  app.post('/new_post', checkAuthenticated, (req, res) => {

    const post = {
      ID_P:req.user.ID,
      SIMPTOME:req.body.simptome,
      STATUS:"Inregistrata"
      };

      connection.query('INSERT INTO postari SET ?', post, (err, response) => {
            if(err){ 
              res.send('a aparut o eroare!\n\n\n'+err)
              throw err;}
            console.log('Last post inserted ID:', response.insertId);
            res.redirect('/')
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
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)

      const cont = {
        NUME:req.body.nume,
        PRENUME:req.body.prenume,
        EMAIL:req.body.email,
        PAROLA:hashedPassword,
        TELEFON:req.body.telefon,
        NASTERE:req.body.birth,
        SEX:req.body.sex,
        VERIFICAT:0
        };

        connection.query('INSERT INTO pacienti SET ?', cont, (err, response) => {
              if(err){ 
                throw err;
                res.redirect('/register');}
              console.log('Last insert ID:', response.insertId);
              res.redirect('/login')
            });
    } catch {
      res.redirect('/register')
    }
  })
  
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
      return res.redirect('/')
    }
    next()
  }

 /* function checkVerified(req, res, next) {
    if (req.user.nume) {
      return res.redirect('/')
    }
    next()
  }*/

  
  app.listen(process.env.PORT||3000)
var mysql = require('mysql');
var express    = require("express");
var users = require('./users');
var flash = require('connect-flash');
var session = require('express-session');
// This module will not be pushed to github online, it
// contains the mysql database username/password
var CONSTANTS = require('./gitignoreconstants');
var fs = require('fs');
var https = require('https');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
// Set up password stuff
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Create SSL settings for HTTPS
var privateKey  = fs.readFileSync('./sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/server.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};

// dbManager manages communication between the client
// and the mysql database
var dbManager = function(){
	this.con = null;
	this.app = null;
	this.httpsServer = null;
};

var CreateNewConnection = function(dbName) {
	return mysql.createConnection({
	  host: "localhost",
	  user: CONSTANTS.USERNAME,
	  password: CONSTANTS.PASSWORD,
	  database: dbName
	});
}
module.exports.CreateNewConnection = CreateNewConnection;

dbManager.prototype.initialise = function(dbName) {
	this.con = CreateNewConnection(dbName);

	this.con.connect(function(err){
  	if(err){
   		console.log('Error connecting to Db: ' + err);
  	} else {
		console.log('Connection established');
  	}
	});

	this.app = express();

	this.app.set('view engine', 'pug');
	this.app.set('views', './views');

	// Make sure app serves static files
	this.app.use(express.static('../public'));

	// Add ability for express to parse form submitted
	// data into the req.body field
	this.app.use(bodyParser.urlencoded({extended: true}));

	this.app.use(bodyParser.json());

	this.app.use(cookieParser());

	// Add session authenticate
	var connection = this.con;
	passport.use('local', new LocalStrategy(
		function(username, password, done) {
			users.check(connection, username, password, done);
		}
	));
	passport.serializeUser(function(user, done) {
	done(null, user);
	});
	passport.deserializeUser(function(id, done) {
	done(null, id);
	});

	// this.app.set('trust proxy', 1) // trust first proxy
	this.app.use(session({
		secret: 'i am not a camel',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: true }
	}));
	this.app.use(flash());
	this.app.use(passport.initialize());
	this.app.use(passport.session());

	// To access the secret page, the user must be logged in. If they
	// are logged in, it will welcome them with their username
	this.app.get("/secret", function(req, res) {
		if (req.user) {
			res.send('welcome ' + req.user + '. You are on the secret page.');
		} else {
			req.flash('error', 'You need to be logged in to view that page.');
			res.redirect('/login');
		}
	});
	// When the user tries to go to login, if they are already
	// logged in they get taken to the secret page
	this.app.get("/login", function(req, res) {
		if (req.user) {
			res.redirect('/secret');
		} else {
			var m = req.flash('error');
			var msg = "";
			// Render login page depending on error, if any
			if (m.length) {
				msg = m[0];
			}
			res.render('login.pug', {message: msg});
		}
	})

	this.app.post("/login",
  		passport.authenticate('local', { successRedirect: '/',
                                   		 failureRedirect: '/login',
										 failureFlash: true })
	)

	// Add API to database
	require('./api').initialise(this.app, connection);

	this.httpsServer = https.createServer(credentials, this.app);
	var portNumber = 443;
	if (process.env.PORT_NUMBER) {
		var tmp = parseInt(process.env.PORT_NUMBER);
		if (!Number.isNaN(tmp)) {
			portNumber = tmp;
		}
	}
	this.httpsServer.listen(portNumber);
}

dbManager.prototype.close = function() {
	this.con.end();
	this.httpsServer.close();
	this.con = null;
	this.app = null;
	this.httpsServer = null;
}

module.exports.dbManager = dbManager;
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
			res.redirect('/login.html');
		}
	});
	// When the user tries to go to login, if they are already
	// logged in they get taken to the secret page
	this.app.get("/login", function(req, res) {
		if (req.user) {
			res.redirect('/secret');
		} else {
			var m = req.flash('error');
			// TODO - renger login page differently
			// depending on if which login error m contains
			res.redirect('/login.html');
		}
	})
	this.app.get("/age/:age", function(req, res) {
		connection.query("SELECT * FROM people WHERE age = " + req.params['age'] + ";", function(err, rows){
			if (err) {
				console.log('Error with query: ' + err);
				res.send(err);
			} else {
				console.log('Query complete, data:');
				console.log(rows);
				res.send(rows);
			}
		});
	});
	this.app.get("/id/:id/age", function(req, res) {
		connection.query('SELECT age FROM people WHERE id=' + req.params['id'] + ';', function(err, rows) {
			if (err) {
				res.send(err);
			} else if (rows.length == 0) {
				res.send('ID not found');
			} else {
				res.send(rows[0]['age'].toString());
			}
		})
	})
	this.app.put("/id/:id/age/:age", function(req, res) {
		connection.query('UPDATE people SET age=' + req.params['age'] + ' WHERE id=' + req.params['id'] + ';', function(err, rows) {
			if (err) {
				res.send(err);
			} else {
				res.send(rows);
			}
		})
	})
	this.app.put("/person/forename/:forename/surname/:surname/age/:age", function(req, res) {
		q = "INSERT INTO people (id, forename, surname, age) VALUES (NULL, '" + req.params['forename'] + 
			"','" + req.params['surname'] + "'," + req.params['age'] + ");"
		connection.query(q, function(err, newRow) {
				if (err) {
					res.send(err);
				} else {
					res.send(newRow);
				}
			});
	})
	this.app.post("/login",
  		passport.authenticate('local', { successRedirect: '/',
                                   		 failureRedirect: '/login',
										 failureFlash: true })
	)

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
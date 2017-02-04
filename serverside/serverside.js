var mysql = require('mysql');
var express    = require("express");
var app = express();


var dbManager = function(){
	this.con = null;
	this.app = null;
};

var CreateNewConnection = function(dbName) {
	return mysql.createConnection({
	  host: "localhost",
	  user: "root",
	  password: "",
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

	var connection = this.con;
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

	this.app.listen(3000);
}

dbManager.prototype.close = function() {
	this.con.end();
	this.con = null;
	this.app = null;
}

module.exports.dbManager = dbManager;
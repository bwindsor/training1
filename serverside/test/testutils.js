var mysql = require('mysql');
var s = require('../serverside');
var users = require('../users');

module.exports.createSampleUser = function(cb) {
    var c = s.CreateNewConnection("BEN1");
    c.query('DROP TABLE users', function(err) {
    if (err) {
        return cb(err);
    }
    c.query('CREATE TABLE users(username char(30) NOT NULL PRIMARY KEY, password char(100) NOT NULL)', function (err, res) {
        if (err) {
            return cb(err);
        } else {
            users.add(c, 'ben', 'passw0rd', cb);
        }
    })
    });
}

module.exports.CreateSampleDB = function(cb) {
    var c = s.CreateNewConnection("TEST1");
    c.query('DROP TABLE people', function(err) {
    if (err) {
        return cb(err);
    }
    c.query('CREATE TABLE people(id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, forename CHAR(30), surname CHAR(30), age INT(3));', function(err, res) {
        if (err) {
            return cb(err);
        } else {
            c.query("INSERT INTO people (id, forename, surname, age) VALUES \
                (NULL, 'ben', 'windsor', 26), \
                (NULL, 'zuzka', 'strakova', 24), \
                (NULL, 'andy', 'strakova', 26)", function(err, res) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb();
                    }
                });
        }
    });
    });
}
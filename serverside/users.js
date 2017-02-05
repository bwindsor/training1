var bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.add = function(dbConnection, username, password, done) {
    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in password DB. 
        if (err) { return done(err); }
        dbConnection.query("INSERT INTO users (username, password) VALUES \
                ('" + username + "', '" + hash + "')", function(err, res) {
                    if (err) {
                        return done(err);
                    }
                    return done();
                });
    });
}

module.exports.check = function(dbConnection, username, password, done) {
    dbConnection.query("SELECT * FROM users WHERE username='" + username + "'", function(err, res) {
            if (err) {
                return done(err);
            } else if (res.length==0) {
                return done(null, false, {message: 'No matching user found'});
            } else {
                bcrypt.compare(password, res[0]['password'], function(err, res) {
                    if (err) {
                        return done(err);
                    } else if (!res) {
                        return done(null, false, {message: 'Password does not match'});
                    } else {
                        return done(null, username);
                    }
                });
            }
        });
}
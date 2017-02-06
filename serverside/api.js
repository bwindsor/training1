// Sets up all API functions
const API_ENDPOINT = '/api'

module.exports.initialise = function(app, connection) {
    app.get(API_ENDPOINT, function(req, res) {
        res.send('This is the API endpoint.');
    })
    app.get(API_ENDPOINT + "/age/:age", function(req, res) {
		connection.query("SELECT * FROM people WHERE age = ?;", [req.params['age']], function(err, rows){
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
	app.get(API_ENDPOINT + "/id/:id/age", function(req, res) {
		connection.query('SELECT age FROM people WHERE id=?;', [req.params['id']], function(err, rows) {
			if (err) {
				res.send(err);
			} else if (rows.length == 0) {
				res.send('ID not found');
			} else {
				res.send(rows[0]['age'].toString());
			}
		})
	})
	app.put(API_ENDPOINT + "/id/:id/age/:age", function(req, res) {
		connection.query('UPDATE people SET age=' + req.params['age'] + ' WHERE id=' + req.params['id'] + ';', function(err, rows) {
			if (err) {
				res.send(err);
			} else {
				res.send(rows);
			}
		})
	})
	app.put(API_ENDPOINT + "/person/forename/:forename/surname/:surname/age/:age", function(req, res) {
		var q = "INSERT INTO people (id, forename, surname, age) VALUES \
				(NULL, ?, ?, ?);";
		var p = [req.params['forename'], req.params['surname'], req.params['age']];
		connection.query(q, p, function(err, newRow) {
				if (err) {
					res.send(err);
				} else {
					res.send(newRow);
				}
			});
	})
}
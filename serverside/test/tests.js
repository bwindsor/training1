var assert = require('assert');
var request = require('request');
var s = require('../serverside');
var testutils = require('./testutils');

var dbm = new s.dbManager;

var portNumber = 443;
if (process.env.PORT_NUMBER) {
    portNumber = process.env.PORT_NUMBER;
}

describe('request age response', function() {
    before(function(done) {
        testutils.CreateSampleDB(done);
        dbm.initialise("TEST1");
    });

    it('should return the correct age', function(done) {
        request('https://localhost:' + portNumber + '/age/24', function(err, response, body) {
            if (err) {
                done(err);
            } else {
                var jsonResult = JSON.parse(response.body);
                assert.equal(jsonResult.length, 1, 'Wrong number of results');
                for (var ii = 0; ii < jsonResult.length; ii++)
                {
                    assert.equal(jsonResult[ii]['age'], 24, 'Wrong age');
                }
                done();
            }
        })
    });

    after(function() {
        dbm.close();
    });
});
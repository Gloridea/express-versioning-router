var request = require('supertest'),
    express = require('express');
    vrouter = require('../lib/versioning-router');

var assert = require("assert");

describe("VersioningRouter", function() {
    var app;
    var router;

    beforeEach(function() {
        app = express();
        router = vrouter(express);
        app.use(vrouter.redirector);
        app.use('/foo', router);
    });

    it("should redirect requests from different versions to same route", function(done) {
        // Given
        router.get(2, '/hello', function(req, res, next) {
            res.send("hello2");
        });

        // When
        var test1 = request(app).get('/v3/foo/hello');
        var test2 = request(app).get('/v4/foo/hello');

        // Then
        done = countedDone(done, 2);
        test1.expect(200).end(function(err, res) {
            assert.equal(res.text, 'hello2')
            done();
        });
        test2.expect(200).end(function(err, res) {
            assert.equal(res.text, 'hello2')
            done();
        });
    });

    it("should call different route depending on a given version", function(done) {
        // Given
        router.get(1, '/hello', function(req, res, next) {
            res.send("hello1");
        });

        router.get(2, '/hello', function(req, res, next) {
            res.send("hello2");
        });

        // When
        var test = request(app).get('/v2/foo/hello');

        // Then
        test.end(function(err, res) {
            assert.equal(res.text, 'hello2');
            done();
        });
    });

    it("should call given or prior version route", function(done) {
        // Given
        router.get(2, '/hello', function(req, res, next) {
            res.send("hello2");
        });

        router.get(4, '/hello', function(req, res, next) {
            res.send("hello4");
        });

        // When
        var test = request(app).get('/v3/foo/hello');

        // Then
        test.end(function(err, res) {
            assert.equal(res.text, 'hello2');
            done();
        });
    });

    it("should return 404 if non-existing version requested", function(done) {
        // Given
        router.get(2, '/hello', function(req, res, next) {
            res.send("hello2");
        });

        // When
        var test = request(app).get('/v1/foo/hello')

        // Then
        test.expect(404, done);
    });

    it("should have different history per each http verbs", function(done) {
        // Given
        router.get(1, '/hello', function(req, res, next) {
            res.send("hello-get-1");
        });

        router.post(3, '/hello', function(req, res, next) {
            res.send("hello-post-3");
        });

        // When
        var test = request(app).get('/v3/foo/hello')

        // Then
        test.end(function (err, res) {
            assert.equal(res.text, 'hello-get-1');
            done();
        });
    });

    it("should treat version to 1 if not defined", function (done) {
        // Given
        router.get('/hello', function(req, res, next) {
            res.send("hello-get-1");
        });

        // When
        var test = request(app).get('/v2/foo/hello')

        // Then
        test.end(function (err, res) {
            assert.equal(res.text, 'hello-get-1');
            done();
        });
    });

    function countedDone(done, count) {
        var n = 0;
        return function() {
            ++n;
            if (n >= count) {
                done();
            }
        }
    }
});

describe("VersioningRouger.redirector", function () {
    beforeEach(function() {
        app = express();
    });

    function catchUrl(req, res, next) {
        catchUrl.passedUrl = req.url;
        next();
    }

    it("should redirect to original route", function(done) {
        // Given
        // When
        app.use(vrouter.redirector);
        app.use(catchUrl);
        var test = request(app).get('/v1/foo/hello');

        // Then
        test.end(function(err, res) {
            assert.equal(catchUrl.passedUrl, '/foo/hello');
            done();
        });
    });

    it("should bypass if no version in url", function(done) {
        // Given
        var path = "";

        // When
        app.use(vrouter.redirector);
        app.use(catchUrl);
        var test = request(app).get('/foo/hello');

        // Then
        test.end(function(err, res) {
            assert.equal(catchUrl.passedUrl, '/foo/hello');
            done();
        });
    });

    it("should replace first version string only", function (done) {
        // Given
        var path = "";

        // When
        app.use(vrouter.redirector);
        app.use(catchUrl);
        var test = request(app).get('/foo/v123/bar/v345/moo');

        // Then
        test.end(function(err, res) {
            assert.equal(catchUrl.passedUrl, '/foo/bar/v345/moo');
            done();
        });
    });
});
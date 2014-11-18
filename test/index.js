/* jshint node: true, esnext: true */

var assert = require("chai").assert;
var request = require("supertest");

var koa = require("koa");
var route = require("..");

describe("route", function() {
  it("no method routes, respond to any method", function(done) {
    var app = koa();
    var handler = route("/foo/bar", function *(next) {
      this.status = 200;
    });

    app.use(handler);

    request(app.listen())
    .post("/foo/bar")
    .expect(200)
    .end(done);
  });

  it("routes on method", function(done) {
    var app = koa();
    var handlera  = route("GET", "/foo/bar", function *(next) {
      this.status = 404;
    });

    var handlerb  = route("POST", "/foo/bar", function *(next) {
      this.status = 200;
      this.body = "Hello World!";
    });

    app.use(handlera);
    app.use(handlerb);

    request(app.listen())
    .post("/foo/bar")
    .expect(200)
    .expect("Hello World!")
    .end(done);
  });

  it("handler must be a generator function", function() {
    assert.throws(function() {
      route("/foo/bar", function(next) {
        //
      });
    }, "handler function must be a GeneratorFunction");
  });

  it("path comparison does not include query string", function(done) {
    var app = koa();
    var handler = route("/foo/bar", function *(next) {
      this.status = 200;
      this.body = "hello world!";
    });

    app.use(handler);

    request(app.listen())
    .get("/foo/bar")
    .query({
      baz: "qux",
      abc: 123
    })
    .expect(200)
    .expect("hello world!")
    .end(done);
  });
});

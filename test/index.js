/* jshint node: true, esnext: true */

var assert = require("chai").assert;
var request = require("supertest");

var koa = require("koa");
var mount = require("..");

describe("mount", function() {
  it("no method mounts, respond to any method", function(done) {
    var app = koa();
    var handler = mount("/foo/bar", function *(next) {
      this.status = 200;
    });

    app.use(handler);

    request(app.listen())
    .post("/foo/bar")
    .expect(200)
    .end(done);
  });

  it("mounts on method", function(done) {
    var app = koa();
    var handlera  = mount("GET", "/foo/bar", function *(next) {
      this.status = 404;
    });

    var handlerb  = mount("POST", "/foo/bar", function *(next) {
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
      mount("/foo/bar", function(next) {
        //
      });
    }, "handler function must be a GeneratorFunction");
  });

  it("path comparison does not include query string", function(done) {
    var app = koa();
    var handler = mount("/foo/bar", function *(next) {
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

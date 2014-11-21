/* jshint node: true, esnext: true, noyield: true */

var assert = require("chai").assert;
var request = require("supertest");
var koaBody = require("koa-better-body");

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

  it.skip("handler must be a generator function", function() {
    assert.throws(function() {
      route("/foo/bar", function(next) {
        //
      });
    }, "handler function must be a GeneratorFunction");
  });

  it("method must be a valid method", function() {
    assert.throws(function() {
      route("FOO", "/foo/bar", function *(next) {
        //
      });
    }, "FOO method is not supported");
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

  it("supports parameterized paths", function(done) {
    var app = koa();
    var handler = route("/posts/:post_id/comments/:id/", function *(next) {
      this.status = 200;
      this.body = "This is post #"+this.params.post_id+"'s comment #"+this.params.id;
    });

    app.use(handler);

    request(app.listen())
    .get("/posts/123/comments/456")
    .expect(200)
    .expect("This is post #123's comment #456")
    .end(done);
  });

  it("request paths that don't meet path pattern splits, gracefully 404", function(done) {
    var app = koa();
    var handler = route("/posts/:post_id/comments/:id/", function *(next) {
      this.status = 200;
      this.body = "This is post #"+this.params.post_id+"'s comment #"+this.params.id;
    });

    app.use(handler);

    request(app.listen())
    .get("/posts")
    .expect(404)
    .end(done);
  });

  it(".:format requires the extention in the request url", function(done) {
    var app = koa();
    var handler = route("/posts/:post_id/comments/:id.:format", function *(next) {
      this.status = 200;
      this.body = "This is the "+this.params.format+" version of post #"+
        this.params.post_id+"'s comment #"+this.params.id;
    });

    app.use(handler);

    request(app.listen())
    .get("/posts/123/comments/456.html")
    .expect(200)
    .expect("This is the html version of post #123's comment #456")
    .end(done);
  });

  it("can accept multiple middlewares to executed in argument order", function(done) {
    var app = koa();
    var a = function *(next) {
      this.body = "Hello ";
      yield* next;
    };
    var b = function *(next) {
      this.body+= "World";
      yield* next;
    };

    var handler = route("/multi/yields", a, b, function *(next) {
      this.status = 200;
      this.body+= "!";
    });

    app.use(handler);

    request(app.listen())
    .get("/multi/yields")
    .expect(200)
    .expect("Hello World!")
    .end(done);
  });

  it("the last function in the route stack is given the next of the app stack", 
    function(done) {

    var app = koa();
    var a = function *(next) {
      this.body = "Not ";
      yield* next;
    };

    var handler = route("/multi/yields", a, function *(next) {
      this.body+= "Found";
      yield next;
    });

    app.use(handler);
    app.use(function *() {
      this.status = 404;
      this.body+= "!";
    });

    request(app.listen())
    .get("/multi/yields")
    .expect(404)
    .expect("Not Found!")
    .end(done);
  });

  it("works with other middlewares", function(done) {
    var app = koa();
    var a = function *(next) {
      yield* next;
    };

    var handler = route("POST", "/posts", a, koaBody(), function *(next) {
      this.body = this.request.body;
    });

    app.use(handler);

    request(app.listen())
    .post("/posts")
    .send({foo: "bar"})
    .expect(200)
    .expect({fields: {foo: "bar"}})
    .end(done);
  });
});

# mountain

[![Build Status](https://travis-ci.org/nowk/mountain-js.svg?branch=master)](https://travis-ci.org/nowk/mountain-js)
[![David DM](https://david-dm.org/nowk/mountain-js.png)](https://david-dm.org/nowk/mountain-js)

<!-- [![Code Climate](https://codeclimate.com/github/nowk/mountain-js.png)](https://codeclimate.com/github/nowk/mountain-js) -->

Simple routing for Koa

## Install

    npm install mountain-js

## Usage

    const route = require("mountain-js");

## Examples

    let app = koa();
    app.use(route("GET", "/posts", function *(next) {
      this.body = "got posts!";
    }));

    app.listen();

Allow route on all methods.

    app.use(route("/posts", function *(next) {
      this.body = "always got posts!";
    }));

Param'd URLs.

    app.use(route("GET", "/posts/:id", function *(next) {
      this.body = "got post #" + this.params.id;
    }));

More middlewares.

    let myMiddleware = function *(next) {
      yield next;
    }

    app.use(route("POST", "/posts", myMiddleware, koaBody(), function *(next) {
      this.body = "posted to posts";
    }));

Jump back out to the app from the routed middlewares

    app.use(route("GET", "/posts", function *(next) {
      this.body = "posted to posts";
      yield next;
    }));

    app.use(function *(next) {
      // hello!
    });

## License

MIT


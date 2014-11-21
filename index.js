/* jshint node: true, esnext: true */
"use strict";

var assert = require("assert");

/**
 * expose
 */

module.exports = route;

/**
 * methods
 */

let methods = [
  "GET",
  "POST",
  "PUT",
  "HEAD",
  "DELETE",
  "OPTIONS",
  "TRACE",
  "PATCH"
];

/**
 * route routes a handler fn to a method and path
 *
 * @param {String} method (optional, defaults to GET)
 * @param {String} pathStr
 * @param {GeneratorFunction} fn
 * @return {GeneratorFunction}
 * @api public
 */

function route(method, pathStr) {
  var offset = 2;
  if ("string" !== typeof pathStr) {
    offset = 1;
    pathStr = method;
    method = null;
  }

  var fns = Array.prototype.slice.call(arguments, offset);

  // if (!isGenerator(fn)) {
  //   throw new Error("handler function must be a GeneratorFunction");
  // }

  if (method) {
    method = method.toUpperCase();

    if (!~methods.indexOf(method)) {
      throw new Error(method + " method is not supported");
    }
  }

  return function *(next) {
    if (isMethod.call(this, method) && pathsMatch.call(this, pathStr)) {
      return yield* iteration.call(this, fns, next);
    }

    yield next;
  };
}

/**
 * iteration returns an iterator interface that will call each function in the
 * route stack.
 *
 * @param {Array} fns (array of generator functions)
 * @param {Function} done (this the app stacks next)
 * @return {Object}
 * @api private
 */

function iteration(fns, done) {
  // jshint validthis: true
  var self = this;
  var n = 0;
  var it = {
    next: function() {
      if (fns.length === n) {
        return {done: true};
      }

      var fn = fns[n];
      n++;

      var next = it;
      if (fns.length === n) {
        next = done;
      }
      return {done: false, value: fn.call(self, next)};
    }
  };

  return it;
}

/**
 * pathsMatch asserts the request path
 *
 * @param {String} pathPattern
 * @return {Bool}
 * @api private
 */

function pathsMatch(pathPattern) {
  /* jshint validthis: true */
  if (/:[a-z0-9_]+/gi.test(pathPattern)) {
    var reg = /\/?[a-z0-9-_:]+/gi;

    var p = pathPattern.match(reg);
    var s = this.path.match(reg);
    if (!s || s.length < p.length) {
      return false;
    }

    var params = parameterize.call(p, s);

    try {
      assert.deepEqual(p, s);
      this.params = params;
      return true;
    } catch(e) {
      if (!e instanceof assert.AssertionError) {
        throw e;
      }
    }

    return false;
  }

  return pathPattern === this.path;
}

/**
 * parameterize maps and replaces associated param values to keys
 *
 * @param {Object} s (original url split)
 * @return {Object} (key:value of parsed param keys to value)
 * @api private
 */

function parameterize(s) {
  /* jshint validthis: true */
  var self = this;
  var params = {};
  var i = 0;
  var len = this.length;
  for(; i < len; i++) {
    var n = self[i];
    var m = s[i];
    if (/^\/?:/.test(n)) {
      self[i] = m;
      var prop = n.replace(/\/?:/, "");
      params[prop] = m.replace(/\/?/, "");
    }
  }

  return params;
}

/**
 * isMethod asserts the request method
 *
 * @param {String} method
 * @return {Bool}
 * @api private
 */

function isMethod(method) {
  if (!method) {
    return true;
  }

  /* jshint validthis: true */
  return method === this.request.method.toUpperCase();
}


/**
 * isGenerator asserts the handler is a GeneratorFunction
 *
 * @param {GenratorFunction} fn
 * @return {Bool}
 * @api private
 */

function isGenerator(fn) {
  return /^function\s?\*\s?\(/.test(fn.toString());
}

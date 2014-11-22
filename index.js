/* jshint node: true, esnext: true */
"use strict";

const assert = require("assert");

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
  let offset = 2;
  if ("string" !== typeof pathStr) {
    offset = 1;
    pathStr = method;
    method = null;
  }

  let fns = Array.prototype.slice.call(arguments, offset);

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
  let self = this;
  let n = 0;
  let it = {
    next: function() {
      if (fns.length === n) {
        return {done: true};
      }

      let fn = fns[n];
      n++;

      let next = it;
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
  if (/:[a-z0-9_]+/gi.test(pathPattern)) {
    let reg = /\/?[a-z0-9-_:]+/gi;

    let p = pathPattern.match(reg);
    let s = this.path.match(reg);
    if (!s || s.length < p.length) {
      return false;
    }

    let params = parameterize.call(p, s);

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
  let self = this;
  let params = {};
  let i = 0;
  let len = this.length;
  for(; i < len; i++) {
    let n = self[i];
    let m = s[i];
    if (/^\/?:/.test(n)) {
      self[i] = m;
      let prop = n.replace(/\/?:/, "");
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

  return method === this.request.method.toUpperCase();
}


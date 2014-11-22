/* jshint node: true, esnext: true */
"use strict";

const assert = require("assert");
const methods = require("methods");
const compose = require("koa-compose");

/**
 * expose
 */

module.exports = route;

/**
 * route routes a handler fn to a method and path
 *
 * @param {String} meth (optional, defaults to GET)
 * @param {String} path
 * @return {GeneratorFunction}
 * @api public
 */

function route(meth, path) {
  let i = 2;
  if ("string" !== typeof path) {
    i = 1;
    path = meth;
    meth = null;
  }
  let fns = compose(Array.prototype.slice.call(arguments, i));

  if (meth) {
    meth = meth.toLowerCase();
  }

  if (meth && !~methods.indexOf(meth)) {
    throw new Error(meth.toUpperCase() + " method is not supported");
  }

  path = parsePath(path);

  return function *(next) {
    if (!isMethod.call(this, meth)) {
      yield next;
      return;
    }

    if (pathsMatch.call(this, path)) {
      yield fns.call(this, next);
      return;
    }

    yield next;
  };
}

let paramPathReg = /\/?[a-z0-9-_:]+/gi;

/**
 * parsePath parses the route path and returns an array if it has param keys,
 * else it returns the original path
 *
 * @param {String} path
 * @return {Array|String}
 * @api private
 */

function parsePath(path) {
  if (/:[a-z0-9_]+/gi.test(path)) {
    return path.match(paramPathReg);
  }

  return path;
}

/**
 * pathsMatch asserts the request path
 *
 * @param {String} path
 * @return {Bool}
 * @api private
 */

function pathsMatch(path) {
  if ("string" === typeof path) {
    return path === this.path;
  }

  let s = this.path.match(paramPathReg);
  if (!s || s.length < path.length) {
    return false;
  }

  let params = {};
  applyParams.call(path, s, params);

  try {
    assert.deepEqual(path, s);
    this.params = params;

    return true;
  } catch(e) {
    if (!e instanceof assert.AssertionError) {
      throw e;
    }
  }

  return false;
}

/**
 * applyParams maps and replaces associated param values to keys
 *
 * @param {Object} s (original url split)
 * @param {Object} params
 * @api private
 */

function applyParams(s, params) {
  let self = this;
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

  return method === this.method.toLowerCase();
}


/* jshint node: true, esnext: true */
"use strict";

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

function route(method, pathStr, fn) {
  if ("undefined" === typeof fn) {
    fn = pathStr;
    pathStr = method;
    method = null;
  }

  if (!isGenerator(fn)) {
    throw new Error("handler function must be a GeneratorFunction");
  }

  if (method) {
    method = method.toUpperCase();

    if (!~methods.indexOf(method)) {
      throw new Error(method + " method is not supported");
    }
  }

  return function *(next) {
    if (isMethod.call(this, method) && pathsMatch.call(this, pathStr)) {
      return yield fn;
    }

    yield next;
  };
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
  var pathStr = this.request.url.split("?")[0];

  if (/:[a-z0-9_]+/gi.test(pathPattern)) {
    var reg = /\/?[a-z0-9_:]+/gi;
    var p = pathPattern.match(reg);
    var s = pathStr.match(reg);

    var params = {};
    var i = 0;
    var len = p.length;
    for(; i < len; i++) {
      var n = p[i];
      var m = s[i];
      if (/^\/?:/.test(n)) {
        p[i] = m;
        var prop = n.replace(/\/?:/, "");
        params[prop] = m.replace(/\/?/, "");
      }
    }

    var r = new RegExp(p.join(""), "gi");
    if (r.test(pathStr)) {
      this.params = params;
      return true;
    }

    return false;
  }

  return pathPattern === pathStr;
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

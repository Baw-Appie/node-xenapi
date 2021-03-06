// Generated by CoffeeScript 1.10.0
(function() {
  var APIClient, Promise, debug,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  debug = require('debug')('APIClient');

  Promise = require('bluebird');

  APIClient = (function() {

    /**
    * Construct APIClient
    * @class
    * @param      {Object}   xmlrpc
    * @param      {Object}   options - for connecting to the API
    * @param      {String}   options.host - The host the API is being served on
    * @param      {String}   options.port - The port the API is being served on
     */
    function APIClient(xmlrpc, options) {
      this.options = options;
      this.request = bind(this.request, this);
      debug("constructor()");
      if (!xmlrpc) {
        throw Error("Must provide xmlrpc");
      }
      if (!this.options) {
        throw Error("Must provide options");
      }
      if (!this.options.host) {
        throw Error("Must provide `host` in options");
      }
      if (!this.options.port) {
        throw Error("Must provide `port` in options");
      }
      this.client = xmlrpc.createClient(this.options);
    }


    /**
     * Make a request via the API
     * @protected
     * @param      {String}   method - The method to call on the API
     * @param      {Array}   args - Array of arguments pass to the API
     * @return     {Promise}
     */

    APIClient.prototype.request = function(method, args) {
      debug("request(" + method + ", " + args + ")");
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.client.methodCall(method, args, function(error, value) {
            if (error) {
              return reject(error);
            } else {
              debug(value);
              if (value.Status === "Failure") {
                return reject(value.ErrorDescription);
              } else {
                return resolve(value.Value);
              }
            }
          });
        };
      })(this));
    };

    return APIClient;

  })();

  module.exports = APIClient;

}).call(this);

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('APIClient');
const Promise = require('bluebird');

class APIClient {
  /**
  * Construct APIClient
  * @class
  * @param      {Object}   xmlrpc
  * @param      {Object}   options - for connecting to the API
  * @param      {String}   options.host - The host the API is being served on
  * @param      {String}   options.port - The port the API is being served on
  */
  constructor(xmlrpc, options) {
    this.request = this.request.bind(this);
    this.options = options;
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
  request(method, args) {
    debug(`request(${method}, ${args})`);
    return new Promise((resolve, reject) => {
      return this.client.methodCall(method, args, (error, value) => {
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
    });
  }
}

module.exports = APIClient;

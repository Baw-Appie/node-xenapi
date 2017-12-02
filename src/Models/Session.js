/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Session');
const Promise = require('bluebird');

class Session {
  /**
  * Construct Session
  * @class
  * @param      {Object}   apiClient - An instance of APIClient
  */
  constructor(apiClient) {
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.request = this.request.bind(this);
    this.apiClient = apiClient;
    debug("constructor()");
    if (!this.apiClient) {
      throw Error("Must provide apiClient");
    }

    this.loggedIn = false;
  }

  /**
   * Login to the API
   * @param      {String}   username - The Username to log in with
   * @param      {String}   password - The Password to log in with
   * @return     {Promise}
  */
  login(username, password) {
    debug("login()");
    return new Promise((resolve, reject) => {
      if (!this.loggedIn) {
        return this.apiClient.request("session.login_with_password", [username, password]).then(value => {
          debug("login Completed");
          this.loggedIn = true;
          this.sessionID = value;
          return resolve();
      }).catch(e => {
          debug("login Failed");
          return reject(e);
        });
      } else {
        debug("already logged in");
        return reject();
      }
    });
  }

  /**
   * Logout from the API
   * @return     {Promise}
  */
  logout() {
    debug("logout()");
    return new Promise((resolve, reject) => {
      if (!this.loggedIn) {
        debug("not currently logged in");
        return reject();
      } else {
        return this.apiClient.request("session.logout", [this.sessionID]).then(value => {
          debug("logout Completed");
          this.loggedIn = false;
          return resolve();
      }).catch(() => {
          debug("logout Failed");
          return reject();
        });
      }
    });
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

    if (!this.loggedIn) {
      debug("not logged in");
      throw Error("Must be logged in to make API requests.");
    }

    if (!args) {
      args = [];
    }

    return new Promise((resolve, reject) => {
      args.unshift(this.sessionID);
      return this.apiClient.request(method, args).then(value => {
        return resolve(value);
    }).catch(e => {
        return reject(e);
      });
    });
  }
}

module.exports = Session;

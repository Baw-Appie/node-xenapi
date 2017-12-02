/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:ConsoleCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var ConsoleCollection = (function() {
  let Console = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createConsoleInstance = undefined;
  ConsoleCollection = class ConsoleCollection {
    static initClass() {
      Console = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createConsoleInstance = (console, opaqueRef) => {
        return new Console(session, console, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct ConsoleCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Console - Dependency injection of the Console class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _console, _xenAPI) {
      this.list = this.list.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_console) {
        throw Error("Must provide Console");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Console = _console;
    }

    /**
    * List all ConsoleCollection
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("console.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const Consoles = _.map(value, createConsoleInstance());
          return resolve(_.filter(Consoles, consoles => consoles));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        const query = `field "uuid"="${uuid}"`;
        return session.request("console.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const Consoles = _.map(value, createConsoleInstance);
          const filtered = _.filter(Consoles, consoles => consoles);
          if (filtered.length > 1) {
            return reject(`Multiple Metrics for UUID ${uuid}`);
          } else {
            return resolve(filtered[0]);
          }
      })
        .catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("console.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const console = createConsoleInstance(value, opaqueRef);
          return resolve(console);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  ConsoleCollection.initClass();
  return ConsoleCollection;
})();

module.exports = ConsoleCollection;

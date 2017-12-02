/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Pool');
const Promise = require('bluebird');

var Pool = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Pool = class Pool {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct Pool
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   pool - A JSON object representing this Pool
    * @param      {String}   opaqueRef - The OpaqueRef handle to this Pool
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _pool, _opaqueRef, _xenAPI) {
      this.getDefaultSR = this.getDefaultSR.bind(this);
      debug("constructor()");
      debug(_pool);
      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_pool) {
        throw Error("Must provide `pool`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }
      if (!_xenAPI) {
        throw Error("Must provide `xenAPI`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _pool.uuid;
      this.name = _pool.name_label;
      this.description = _pool.name_description;
    }

    getDefaultSR() {
      debug("getDefaultSR()");
      return new Promise((resolve, reject) => {
        return session.request("pool.get_default_SR", [this.opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          return xenAPI.srCollection.findOpaqueRef(value).then(sr => resolve(sr)).catch(function(e) {
            debug(e);
            if (e[0] === "HANDLE_INVALID") {
              return reject(new Error("Xen reported default SR, but none found. Is one set as default?"));
            } else {
              return reject(e);
            }
          });
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  Pool.initClass();
  return Pool;
})();

module.exports = Pool;

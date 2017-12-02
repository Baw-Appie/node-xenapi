/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:SR');
const Promise = require('bluebird');

var SR = (function() {
  let session = undefined;
  let xenAPI = undefined;
  SR = class SR {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct SR
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   sr - A JSON object representing this SR
    * @param      {String}   opaqueRef - The OpaqueRef handle to this SR
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _sr, _opaqueRef, _xenAPI) {
      this.scan = this.scan.bind(this);
      debug("constructor()");
      debug(_sr, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_sr) {
        throw Error("Must provide `sr`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _sr.uuid;
      this.name = _sr.name_label;
      this.description = _sr.name_description;
      this.allowed_operations = _sr.allowed_operations;
      this.current_operations = _sr.current_operations;
      this.VDIs = _sr.VDIs;
      this.PBDs = _sr.PBDs;
      this.physical_utilisation = _sr.physical_utilisation;
      this.physical_size = _sr.physical_size;
      this.unused_space = _sr.physical_size - _sr.physical_utilisation;
    }

    scan() {
      debug("scan()");
      return new Promise((resolve, reject) => {
        return session.request("SR.scan", [this.opaqueRef]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  SR.initClass();
  return SR;
})();

module.exports = SR;

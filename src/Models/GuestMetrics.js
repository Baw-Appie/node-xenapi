/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:GuestMetrics');
const Promise = require('bluebird');

var GuestMetrics = (function() {
  let session = undefined;
  let xenAPI = undefined;
  GuestMetrics = class GuestMetrics {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct GuestMetrics
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   guestmetrics - A JSON object representing this GuestMetrics
    * @param      {String}   opaqueRef - The OpaqueRef handle to this GuestMetrics
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _guestmetrics, _opaqueRef, _xenAPI) {
      debug("constructor()");
      debug(_guestmetrics, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_guestmetrics) {
        throw Error("Must provide `guestmetrics`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _guestmetrics.uuid;
      this.networks = _guestmetrics.networks;
      this.os_version = _guestmetrics.os_version;
      this.memory = _guestmetrics.memory;
      this.disks = _guestmetrics.disks;
      this.last_updated = _guestmetrics.last_updated;
    }
  };
  GuestMetrics.initClass();
  return GuestMetrics;
})();

module.exports = GuestMetrics;

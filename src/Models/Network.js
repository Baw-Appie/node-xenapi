/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Network');
const Promise = require('bluebird');

var Network = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Network = class Network {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct Network
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   network - A JSON object representing this Network
    * @param      {String}   opaqueRef - The OpaqueRef handle to this Network
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _network, _opaqueRef, _xenAPI) {
      debug("constructor()");
      debug(_network, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_network) {
        throw Error("Must provide `network`");
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
      this.uuid = _network.uuid;
      this.name = _network.name_label;
      this.VIFs = _network.VIFs;
      this.PIFs = _network.PIFs;
      this.MTU = _network.MTU;
    }
  };
  Network.initClass();
  return Network;
})();

module.exports = Network;

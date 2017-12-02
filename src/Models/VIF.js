/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VIF');
const Promise = require('bluebird');

var VIF = (function() {
  let session = undefined;
  let xenAPI = undefined;
  VIF = class VIF {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
  
      VIF.ALLOWED_OPERATIONS = {
        ATTACH: "attach",
        UNPLUG: "unplug"
      };
    }

    /**
    * Construct VIF
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   vif - A JSON object representing this VIF
    * @param      {String}   opaqueRef - The OpaqueRef handle to this VIF
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _vif, _opaqueRef, _xenAPI) {
      this.toJSON = this.toJSON.bind(this);
      this.push = this.push.bind(this);
      debug("constructor()");
      debug(_vif, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_vif) {
        throw Error("Must provide `vif`");
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
      this.uuid = _vif.uuid;
      this.MAC = _vif.MAC;
      this.MTU = _vif.MTU;
      this.device = _vif.device;
      this.network = _vif.network;
      this.vm = _vif.VM;
      this.attached = _vif.currently_attached;
    }

    toJSON() {
      return {
        MAC: this.MAC,
        MTU: this.MTU,
        device: this.device,
        VM: this.vm,
        network: this.network,
        other_config: {},
        qos_algorithm_type: "",
        qos_algorithm_params: {}
      };
    }

    push() {
      return new Promise((resolve, reject) => {
        return session.request("VIF.create", [this.toJSON()]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VIF.initClass();
  return VIF;
})();

module.exports = VIF;

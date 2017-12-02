/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VBD');
const Promise = require('bluebird');

var VBD = (function() {
  let session = undefined;
  let xenAPI = undefined;
  VBD = class VBD {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
  
      VBD.MODES = {
        RO: "RO",
        RW: "RW"
      };
  
      VBD.TYPES = {
        CD: "CD",
        DISK: "Disk"
      };
    }

    /**
    * Construct VBD.
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   vbd - A JSON object representing this VBD
    * @param      {String}   opaqueRef - The OpaqueRef handle to this vbd
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _vbd, _opaqueRef, _xenAPI) {
      this.toJSON = this.toJSON.bind(this);
      this.insert = this.insert.bind(this);
      this.push = this.push.bind(this);
      this.getVDI = this.getVDI.bind(this);
      debug("constructor()");
      debug(_vbd, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_vbd) {
        throw Error("Must provide `vbd`");
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
      this.uuid = _vbd.uuid;
      this.VM = _vbd.VM;
      this.VDI = _vbd.VDI;
      this.userdevice = _vbd.userdevice;
      this.mode = _vbd.mode;
      this.type = _vbd.type;
      this.empty = _vbd.empty;
    }

    toJSON() {
      return {
        VM: this.VM,
        VDI: this.VDI,
        userdevice: this.userdevice,
        mode: this.mode,
        type: this.type,
        empty: this.empty,
        bootable: true,
        other_config: {},
        qos_algorithm_type: "",
        qos_algorithm_params: {}
      };
    }

    insert(vdi) {
      return new Promise((resolve, reject) => {
        return session.request("VBD.insert", [this.opaqueRef, vdi]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    push() {
      return new Promise((resolve, reject) => {
        return session.request("VBD.create", [this.toJSON()]).then(value => {
          debug(value);
          return xenAPI.vbdCollection.findOpaqueRef(value).then(vbd => resolve(vbd));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    getVDI() {
      debug("getVDI()");
      return new Promise((resolve, reject) => {
        return xenAPI.vdiCollection.findOpaqueRef(this.VDI).then(vdi => resolve(vdi)).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VBD.initClass();
  return VBD;
})();

module.exports = VBD;

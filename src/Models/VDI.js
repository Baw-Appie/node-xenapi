/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VDI');
const Promise = require('bluebird');

var VDI = (function() {
  let session = undefined;
  let xenAPI = undefined;
  VDI = class VDI {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct VDI.
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   vdi - A JSON object representing this VDI
    * @param      {String}   opaqueRef - The OpaqueRef handle to this VDI
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _vdi, _opaqueRef, _xenAPI) {
      this.destroy = this.destroy.bind(this);
      this.copy = this.copy.bind(this);
      this.resize = this.resize.bind(this);
      debug("constructor()");
      debug(_vdi, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_vdi) {
        throw Error("Must provide `vdi`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _vdi.uuid;
      this.name = _vdi.name_label;
      this.description = _vdi.name_description;
      this.allowed_operations = _vdi.allowed_operations;
      this.virtual_size = _vdi.virtual_size;
      this.SR = _vdi.SR;
    }

    destroy() {
      debug("destroy()");
      return new Promise((resolve, reject) => {
        return session.request("VDI.destroy", [this.opaqueRef]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    copy(targetSR) {
      debug(`copy(${targetSR.uuid})`);
      return new Promise((resolve, reject) => {
        return session.request("VDI.copy", [this.opaqueRef, targetSR.opaqueRef]).then(value => {
          debug(value);
          return xenAPI.vdiCollection.findOpaqueRef(value).then(vdi => {
            return resolve(vdi);
          });
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    resize(targetSize) {
      debug(`resize(${targetSize})`);
      return new Promise((resolve, reject) => {
        return session.request("VDI.resize", [this.opaqueRef, targetSize]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VDI.initClass();
  return VDI;
})();

module.exports = VDI;

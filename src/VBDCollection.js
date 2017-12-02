/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VBDCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var VBDCollection = (function() {
  let VBD = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createVBDInstance = undefined;
  VBDCollection = class VBDCollection {
    static initClass() {
      VBD = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createVBDInstance = (vbd, opaqueRef) => {
        return new VBD(session, vbd, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct VBDCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   VBD - Dependency injection of the VBD class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _VBD, _xenAPI) {
      this.list = this.list.bind(this);
      this.create = this.create.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      this.findForVM = this.findForVM.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_VBD) {
        throw Error("Must provide VBD");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      VBD = _VBD;
    }

    /**
    * List all VBDs
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("VBD.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const VBDs = _.map(value, createVBDInstance);
          return resolve(_.filter(VBDs, vbd => vbd));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    create(vm, mode, type, vdi, userdevice) {
      debug("create()");

      return new Promise((resolve, reject) => {
        let empty, vdiRef;
        if (!vdi) {
          vdiRef = "OpaqueRef:NULL";
          empty = true;
        } else {
          vdiRef = vdi.opaqueRef;
          empty = false;
        }
        const vbd = {
          VM: vm.opaqueRef,
          VDI: vdiRef,
          userdevice,
          mode,
          type,
          empty
        };

        const newVBD = new VBD(session, vbd, "OpaqueRef:NULL", xenAPI);

        return resolve(newVBD);
      });
    }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VBD.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const template = createVBDInstance(value, opaqueRef);
          return resolve(template);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findForVM(vm) {
      debug("findForVM()");
      return new Promise((resolve, reject) => {
        const query = `field "VM"="${vm.opaqueRef}"`;
        return session.request("VBD.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const VBDs = _.map(value, createVBDInstance);
          return resolve(_.filter(VBDs, vbd => vbd));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VBDCollection.initClass();
  return VBDCollection;
})();

module.exports = VBDCollection;

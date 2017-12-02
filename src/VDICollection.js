/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VDICollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var VDICollection = (function() {
  let VDI = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createVDIInstance = undefined;
  VDICollection = class VDICollection {
    static initClass() {
      VDI = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createVDIInstance = (vdi, opaqueRef) => {
        return new VDI(session, vdi, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct VDICollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   VDI - Dependency injection of the VBD class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _VDI, _xenAPI) {
      this.list = this.list.bind(this);
      this.findSR = this.findSR.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_VDI) {
        throw Error("Must provide VDI");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      VDI = _VDI;
    }

    /**
    * List all VDIs
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("VDI.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const VDIs = _.map(value, createVDIInstance);
          return resolve(_.filter(VDIs, vdi => vdi));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findSR(SR) {
      debug(`findSR(${SR})`);
      return new Promise((resolve, reject) => {
        return this.list().then(VDIs => {
          const vdiOnSR = function(vdi) {
            if (vdi.SR === SR) {
              return vdi;
            }
          };

          const matches = _.map(VDIs, vdiOnSR);
          return resolve(_.filter(matches, vdi => vdi));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
    }).catch(function(e) {
        debug(e);
        return reject(e);
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        return this.list().then(VDIs => {
          const matchVDIuuid = function(vdi) {
            if (vdi.uuid === uuid) {
              return vdi;
            }
          };

          const matches = _.map(VDIs, matchVDIuuid);
          return resolve(_.filter(matches, vdi => vdi));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VDI.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const vdi = createVDIInstance(value, opaqueRef);
          return resolve(vdi);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VDICollection.initClass();
  return VDICollection;
})();

module.exports = VDICollection;

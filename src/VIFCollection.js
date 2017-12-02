/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VIFCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var VIFCollection = (function() {
  let VIF = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createVIFInstance = undefined;
  VIFCollection = class VIFCollection {
    static initClass() {
      VIF = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createVIFInstance = (vif, opaqueRef) => {
        return new VIF(session, vif, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct VIFCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   VIF - Dependency injection of the VIF class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _VIF, _xenAPI) {
      this.list = this.list.bind(this);
      this.create = this.create.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_VIF) {
        throw Error("Must provide VIF");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      VIF = _VIF;
    }

    /**
    * List all VIFs
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("VIF.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const VIFs = _.map(value, createVIFInstance);
          return resolve(_.filter(VIFs, vif => vif));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    create(network, vm, mac) {
      debug("create()");

      return new Promise((resolve, reject) => {
        if (!mac) {
          mac = "";
        }
        const vif = {
          uuid: null,
          device: vm.VIFs.length.toString(),
          MAC: mac,
          MTU: "1500",
          currently_attached: false,
          network: network.opaqueRef,
          VM: vm.opaqueRef
        };

        const newVIF = new VIF(session, vif, "OpaqueRef:NULL", xenAPI);

        return resolve(newVIF);
      });
    }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VIF.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const vif = createVIFInstance(value, opaqueRef);
          return resolve(vif);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VIFCollection.initClass();
  return VIFCollection;
})();

module.exports = VIFCollection;

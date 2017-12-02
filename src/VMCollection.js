/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VMCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var VMCollection = (function() {
  let VM = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createVMInstance = undefined;
  VMCollection = class VMCollection {
    static initClass() {
      VM = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createVMInstance = (vm, opaqueRef) => {
        try {
          return new VM(session, vm, opaqueRef, xenAPI);
        } catch (e) {
          debug("caught error");
          debug(e);
          return null;
        }
      };
    }

    /**
    * Construct VMCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   VM - Dependency injection of the VM class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _VM, _xenAPI) {
      this.list = this.list.bind(this);
      this.createVM = this.createVM.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      this.findUUID = this.findUUID.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_VM) {
        throw Error("Must provide VM");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      VM = _VM;
    }

    /**
     * List all VMs
     * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        const query = 'field "is_a_template" = "false"';
        return session.request("VM.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }
          debug(`Received ${Object.keys(value).length} records`);

          const VMs = _.map(value, createVMInstance);
          return resolve(_.filter(VMs, vm => vm));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    createVM(ram, cpuCount, label) {
        debug("createVM()");
        if (!ram) {
          throw Error("Must provide RAM specification");
        }
        if (!cpuCount) {
          throw Error("Must provide CPU specification");
        }
        if (!label) {
          throw Error("Must provide label");
        }

        return new Promise((resolve, reject) => {
          const memoryValue = ram * 1048576;
          const vCPUMax = cpuCount;
          const extraConfig = {
            name_label: label,
            memory_static_max: memoryValue.toString(),
            memory_static_min: memoryValue.toString(),
            memory_dynamic_max: memoryValue.toString(),
            memory_dynamic_min: memoryValue.toString(),
            VCPUs_max: vCPUMax.toString()
          };

          const config = _.extend(VM.DEFAULT_CONFIG, extraConfig);

          return session.request("VM.create", [config]).then(value => {
            if (!value) {
              reject();
            }

            return this.findOpaqueRef(value).then(vm => resolve(vm));
        }).catch(function(e) {
            debug(e);
            return reject(e);
          });
        });
      }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const vm = createVMInstance(value, opaqueRef);
          return resolve(vm);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid})`);
      return new Promise((resolve, reject) => {
        const query = `field "uuid"="${uuid}"`;
        return session.request("VM.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const VMs = _.map(value, createVMInstance);
          const filtered = _.filter(VMs, vm => vm);
          if (filtered.length > 1) {
            return reject(`Multiple VMs for UUID ${uuid}`);
          } else {
            return resolve(filtered[0]);
          }
      })
        .catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VMCollection.initClass();
  return VMCollection;
})();

module.exports = VMCollection;

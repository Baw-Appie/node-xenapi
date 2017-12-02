/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Template');
const Promise = require('bluebird');
const _ = require('lodash');

var Template = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Template = class Template {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct Template. Very similar to a VM, but not yet set up.
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   template - A JSON object representing this Template
    * @param      {String}   opaqueRef - The OpaqueRef handle to this template
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _template, _opaqueRef, _xenAPI) {
      this.toJSON = this.toJSON.bind(this);
      this.destroy = this.destroy.bind(this);
      this.rename = this.rename.bind(this);
      this.clone = this.clone.bind(this);
      this.pushOtherConfig = this.pushOtherConfig.bind(this);
      this.provision = this.provision.bind(this);
      this.getVBDs = this.getVBDs.bind(this);
      this.setMemoryStaticMax = this.setMemoryStaticMax.bind(this);
      this.setMemoryStaticMin = this.setMemoryStaticMin.bind(this);
      this.setMemoryDynamicMax = this.setMemoryDynamicMax.bind(this);
      this.setMemoryDynamicMin = this.setMemoryDynamicMin.bind(this);
      this.setStartupCPUs = this.setStartupCPUs.bind(this);
      this.setVCPUMax = this.setVCPUMax.bind(this);
      this.convertToVM = this.convertToVM.bind(this);
      debug("constructor()");
      debug(_template, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_template) {
        throw Error("Must provide `template`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }
      if (!_xenAPI) {
        throw Error("Must provide `xenAPI`");
      }
      if (!_template.is_a_template || !!_template.is_control_domain || !_template.uuid) {
        throw Error("`template` does not describe a valid Template");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _template.uuid;
      this.name = _template.name_label;
      this.description = _template.name_description;
      this.VIFs = _template.VIFs || [];
      this.VBDs = _template.VBDs || [];
      this.other_config = _template.other_config;
      //We imply the minimum RAM from the maximum RAM the template supports. XenCenter does this.
      this.ram_minimum = _template.memory_static_max;
      //Same with CPU count.
      this.vcpu_minimum = _template.VCPUs_max;
    }

    toJSON() {
      return {
        name: this.name,
        description: this.description
      };
    }

    destroy() {
      debug("destroy()");
      return new Promise((resolve, reject) => {
        return session.request("VM.destroy", [this.opaqueRef]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    rename(name) {
      debug(`rename(${name})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_name_label", [this.opaqueRef, name]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Clone this Template, creates a new Template
     * @param     {String}  name - A name for the new clone
     * @return    {Promise}
    */
    clone(name) {
      debug("clone()");
      return new Promise((resolve, reject) => {
        if (!name) {
          return reject("Must provide a name for the clone");
        } else {
          return session.request("VM.clone", [this.opaqueRef, name]).then(value => {
            debug(value);
            return xenAPI.templateCollection.findOpaqueRef(value).then(clonedTemplate => resolve(clonedTemplate));
        }).catch(function(e) {
            debug(e);
            return reject(e);
          });
        }
      });
    }

    pushOtherConfig() {
      debug("pushOtherConfig()");
      return new Promise((resolve, reject) => {
        return session.request("VM.set_other_config", [this.opaqueRef, this.other_config]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    provision() {
      debug("provision()");
      return new Promise((resolve, reject) => {
        return session.request("VM.provision", [this.opaqueRef]).then(value => {
          debug(value);
          return xenAPI.vmCollection.findOpaqueRef(this.opaqueRef).then(vm => resolve(vm));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    getVBDs() {
      debug("getVBDs()");
      return new Promise((resolve, reject) => {
        const vbdSearchPromises = [];
        _.each(this.VBDs, function(vbd) {
          const vbdSearchPromise = xenAPI.vbdCollection.findOpaqueRef(vbd);
          return vbdSearchPromises.push(vbdSearchPromise);
        });

        return Promise.all(vbdSearchPromises).then(function(vbdObjects) {
          debug(vbdObjects);
          return resolve(vbdObjects);}).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setMemoryStaticMax(max) {
      debug(`setMemoryStaticMax(${max})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_memory_static_max", [this.opaqueRef, max]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setMemoryStaticMin(min) {
      debug(`setMemoryStaticMin(${min})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_memory_static_min", [this.opaqueRef, min]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setMemoryDynamicMax(max) {
      debug(`setMemoryDynamicMax(${max})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_memory_dynamic_max", [this.opaqueRef, max]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setMemoryDynamicMin(min) {
      debug(`setMemoryDynamicMin(${min})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_memory_dynamic_min", [this.opaqueRef, min]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setStartupCPUs(count) {
      debug(`setStartupCPUs(${count})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_VCPUs_at_startup", [this.opaqueRef, count]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    setVCPUMax(count) {
      debug(`setVCPUMax(${count})`);
      return new Promise((resolve, reject) => {
        return session.request("VM.set_VCPUs_max", [this.opaqueRef, count]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    convertToVM() {
      debug("convertToVM()");
      return new Promise((resolve, reject) => {
        return session.request("VM.set_is_a_template", [this.opaqueRef, false]).then(value => {
          return xenAPI.vmCollection.findOpaqueRef(this.opaqueRef).then(vm => resolve(vm));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  Template.initClass();
  return Template;
})();

module.exports = Template;

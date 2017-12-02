/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:VM');
const Promise = require('bluebird');
const _ = require('lodash');

var VM = (function() {
  let session = undefined;
  let xenAPI = undefined;
  VM = class VM {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
  
      VM.POWER_STATES = {
        HALTED: 'Halted',
        PAUSED: 'Paused',
        RUNNING: 'Running',
        SUSPENDED: 'Suspended'
      };
  
      VM.DEFAULT_CONFIG = {
        user_version: "0",
        is_a_template: false,
        is_control_domain: false,
        affinity: undefined,
        VCPUs_params: {},
        VCPUs_at_startup: "1",
        actions_after_shutdown: "destroy",
        actions_after_reboot: "restart",
        actions_after_crash: "restart",
        PV_bootloader: "pygrub",
        PV_kernel: undefined,
        PV_ramdisk: undefined,
        PV_args: "console=hvc0",
        PV_bootloader_args: undefined,
        PV_legacy_args: undefined,
        HVM_boot_policy: "",
        HVM_boot_params: {},
        platform: {},
        PCI_bus: undefined,
        other_config: {},
        recommendations: ""
      };
    }

    /**
    * Construct VM
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   vm - A JSON object representing this VM
    * @param      {String}   opaqueRef - The OpaqueRef handle to this VM
    * @param      {Object}   xenAPI - An instance of XenAPI.
    */
    constructor(_session, _vm, _opaqueRef, _xenAPI) {
      this.destroy = this.destroy.bind(this);
      this.rename = this.rename.bind(this);
      this.refreshPowerState = this.refreshPowerState.bind(this);
      this.pause = this.pause.bind(this);
      this.unpause = this.unpause.bind(this);
      this.suspend = this.suspend.bind(this);
      this.resume = this.resume.bind(this);
      this.start = this.start.bind(this);
      this.cleanReboot = this.cleanReboot.bind(this);
      this.cleanShutdown = this.cleanShutdown.bind(this);
      this.clone = this.clone.bind(this);
      this.getVBDs = this.getVBDs.bind(this);
      this.getVIFs = this.getVIFs.bind(this);
      this.getMetrics = this.getMetrics.bind(this);
      this.getGuestMetrics = this.getGuestMetrics.bind(this);
      this.getConsoles = this.getConsoles.bind(this);
      this.setMemoryStaticMax = this.setMemoryStaticMax.bind(this);
      this.setMemoryStaticMin = this.setMemoryStaticMin.bind(this);
      this.setMemoryDynamicMax = this.setMemoryDynamicMax.bind(this);
      this.setMemoryDynamicMin = this.setMemoryDynamicMin.bind(this);
      this.setStartupCPUs = this.setStartupCPUs.bind(this);
      this.setVCPUMax = this.setVCPUMax.bind(this);
      this.convertToTemplate = this.convertToTemplate.bind(this);
      debug("constructor()");
      debug(_vm, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_vm) {
        throw Error("Must provide `vm`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }
      if (!_xenAPI) {
        throw Error("Must provide `xenAPI`");
      }
      if (!!_vm.is_a_template || !!_vm.is_control_domain || !_vm.uuid) {
        throw Error("`vm` does not describe a valid VM");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _vm.uuid;
      this.name = _vm.name_label;
      this.description = _vm.name_description;
      this.other_config = _vm.other_config;
      this.xenToolsInstalled = !(_vm.guest_metrics === 'OpaqueRef:NULL');
      this.powerState = _vm.power_state;
      this.consoles = _vm.consoles;
      this.VIFs = _vm.VIFs || [];
      this.VBDs = _vm.VBDs || [];
      this.guest_metrics = _vm.guest_metrics;
      this.metrics = _vm.metrics;
      this.ram = _vm.memory_static_max;
      this.vcpu = _vm.VCPUs_max;
    }

    destroy() {
      debug("destroy()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.HALTED) {
            return reject(`VM not in ${VM.POWER_STATES.HALTED} power state.`);
          } else {
            return session.request("VM.destroy", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
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
     * Refresh the power state of this VM
     * @return     {Promise}
    */
    refreshPowerState() {
      debug("refreshPowerState()");

      return new Promise((resolve, reject) => {
        return session.request("VM.get_power_state", [this.opaqueRef]).then(value => {
          debug(value);
          this.powerState = value;
          return resolve(value);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Pause this VM. Can only be applied to VMs in the Running state.
     * @return     {Promise}
    */
    pause() {
      debug("pause()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.RUNNING) {
            return reject(`VM not in ${VM.POWER_STATES.RUNNING} power state.`);
          } else {
            return session.request("VM.pause", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Unpause this VM. Can only be applied to VMs in the Paused state.
     * @return     {Promise}
    */
    unpause() {
      debug("unpause()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.PAUSED) {
            return reject(`VM not in ${VM.POWER_STATES.PAUSED} power state.`);
          } else {
            return session.request("VM.unpause", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Suspend this VM. Can only be applied to VMs in the Running state.
     * @return     {Promise}
    */
    suspend() {
      debug("suspend()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.RUNNING) {
            return reject(`VM not in ${VM.POWER_STATES.RUNNING} power state.`);
          } else {
            return session.request("VM.suspend", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Resume this VM. Can only be applied to VMs in the Suspended state.
     * @return     {Promise}
    */
    resume() {
      debug("resume()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.SUSPENDED) {
            return reject(`VM not in ${VM.POWER_STATES.SUSPENDED} power state.`);
          } else {
            const startPaused = false;
            const force = false;

            return session.request("VM.resume", [this.opaqueRef, startPaused, force]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    start() {
      debug("start()");
      return new Promise((resolve, reject) => {
        return session.request("VM.start", [this.opaqueRef, false, false]).then(value => {
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    cleanReboot() {
      debug("cleanReboot()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.RUNNING) {
            return reject(`VM not in ${VM.POWER_STATES.RUNNING} power state.`);
          } else {
            return session.request("VM.clean_reboot", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    cleanShutdown() {
      debug("cleanShutdown()");
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.RUNNING) {
            return reject(`VM not in ${VM.POWER_STATES.RUNNING} power state.`);
          } else {
            return session.request("VM.clean_shutdown", [this.opaqueRef]).then(value => {
              return resolve();
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    clone(name) {
      debug(`clone(${name})`);
      return new Promise((resolve, reject) => {
        return this.refreshPowerState().then(currentPowerState => {
          if (currentPowerState !== VM.POWER_STATES.HALTED) {
            return reject(`VM not in ${VM.POWER_STATES.HALTED} power state.`);
          } else {
            return session.request("VM.clone", [this.opaqueRef, name]).then(value => {
              return xenAPI.vmCollection.findOpaqueRef(value).then(clonedVM => resolve(clonedVM)).catch(function(e) {
                debug(e);
                return reject(e);
              });
          }).catch(function(e) {
              debug(e);
              return reject(e);
            });
          }
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

    getVIFs() {
      debug("getVIFs()");
      return new Promise((resolve, reject) => {
        const vifSearchPromises = [];
        _.each(this.VIFs, function(vif) {
          const vifSearchPromise = xenAPI.vifCollection.findOpaqueRef(vif);
          return vifSearchPromises.push(vifSearchPromise);
        });

        return Promise.all(vifSearchPromises).then(function(vifObjects) {
          debug(vifObjects);
          return resolve(vifObjects);}).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    getMetrics() {
      debug("getMetrics()");
      return new Promise((resolve, reject) => {
        return xenAPI.metricsCollection.findOpaqueRef(this.metrics).then(metrics => {
          return resolve(metrics);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    getGuestMetrics() {
      debug("getGuestMetrics()");
      return new Promise((resolve, reject) => {
        return xenAPI.guestMetricsCollection.findOpaqueRef(this.guest_metrics).then(guest_metrics => {
          return resolve(guest_metrics);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    getConsoles() {
      debug("getConsoles()");
      return new Promise((resolve, reject) => {
        const consoleSearchPromises = [];
        _.each(this.consoles, function(console) {
          const consoleSearchPromise = xenAPI.consoleCollection.findOpaqueRef(console);
          return consoleSearchPromises.push(consoleSearchPromise);
        });

        return Promise.all(consoleSearchPromises).then(function(consoleObjects) {
          debug(consoleObjects);
          return resolve(consoleObjects);}).catch(function(e) {
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

    convertToTemplate() {
      debug("convertToTemplate()");
      return new Promise((resolve, reject) => {
        return session.request("VM.set_is_a_template", [this.opaqueRef, true]).then(value => {
          return xenAPI.templateCollection.findOpaqueRef(this.opaqueRef).then(template => resolve(template));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  VM.initClass();
  return VM;
})();

module.exports = VM;

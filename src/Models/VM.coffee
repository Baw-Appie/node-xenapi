debug = require('debug') 'XenAPI:VM'
Promise = require 'bluebird'
_ = require 'lodash'

class VM
  session = undefined
  xenAPI = undefined

  ###*
  * Construct VM
  * @class
  * @param      {Object}   session - An instance of Session
  * @param      {Object}   vm - A JSON object representing this VM
  * @param      {String}   opaqueRef - The OpaqueRef handle to this VM
  * @param      {Object}   xenAPI - An instance of XenAPI.
  ###
  constructor: (_session, _vm, _opaqueRef, _xenAPI) ->
    debug "constructor()"
    debug _vm, _opaqueRef

    unless _session
      throw Error "Must provide `session`"
    unless _vm
      throw Error "Must provide `vm`"
    unless _opaqueRef
      throw Error "Must provide `opaqueRef`"
    unless _xenAPI
      throw Error "Must provide `xenAPI`"
    unless !_vm.is_a_template && !_vm.is_control_domain && _vm.uuid
      throw Error "`vm` does not describe a valid VM"

    #These can safely go into class scope because there is only one instance of each.
    session = _session
    xenAPI = _xenAPI

    @opaqueRef = _opaqueRef
    @uuid = _vm.uuid
    @name = _vm.name_label
    @description = _vm.name_description
    @other_config = _vm.other_config
    @xenToolsInstalled = !(_vm.guest_metrics == 'OpaqueRef:NULL')
    @powerState = _vm.power_state
    @consoles = _vm.consoles
    @VIFs = _vm.VIFs || []
    @VBDs = _vm.VBDs || []
    @guest_metrics = _vm.guest_metrics
    @metrics = _vm.metrics
    @ram = _vm.memory_static_max
    @vcpu = _vm.VCPUs_max

  destroy: =>
    debug "destroy()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.HALTED
          reject "VM not in #{VM.POWER_STATES.HALTED} power state."
        else
          session.request("VM.destroy", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  rename: (name) =>
    debug "rename(#{name})"
    new Promise (resolve, reject) =>
      session.request("VM.set_name_label", [@opaqueRef, name]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  ###*
   * Refresh the power state of this VM
   * @return     {Promise}
  ###
  refreshPowerState: =>
    debug "refreshPowerState()"

    new Promise (resolve, reject) =>
      session.request("VM.get_power_state", [@opaqueRef]).then (value) =>
        debug value
        @powerState = value
        resolve value
      .catch (e) ->
        debug e
        reject e

  ###*
   * Pause this VM. Can only be applied to VMs in the Running state.
   * @return     {Promise}
  ###
  pause: =>
    debug "pause()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.RUNNING
          reject "VM not in #{VM.POWER_STATES.RUNNING} power state."
        else
          session.request("VM.pause", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  ###*
   * Unpause this VM. Can only be applied to VMs in the Paused state.
   * @return     {Promise}
  ###
  unpause: =>
    debug "unpause()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.PAUSED
          reject "VM not in #{VM.POWER_STATES.PAUSED} power state."
        else
          session.request("VM.unpause", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  ###*
   * Suspend this VM. Can only be applied to VMs in the Running state.
   * @return     {Promise}
  ###
  suspend: =>
    debug "suspend()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.RUNNING
          reject "VM not in #{VM.POWER_STATES.RUNNING} power state."
        else
          session.request("VM.suspend", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  ###*
   * Resume this VM. Can only be applied to VMs in the Suspended state.
   * @return     {Promise}
  ###
  resume: =>
    debug "resume()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.SUSPENDED
          reject "VM not in #{VM.POWER_STATES.SUSPENDED} power state."
        else
          startPaused = false
          force = false

          session.request("VM.resume", [@opaqueRef, startPaused, force]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  start: =>
    debug "start()"
    new Promise (resolve, reject) =>
      session.request("VM.start", [@opaqueRef, false, false]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  cleanReboot: =>
    debug "cleanReboot()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.RUNNING
          reject "VM not in #{VM.POWER_STATES.RUNNING} power state."
        else
          session.request("VM.clean_reboot", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  cleanShutdown: =>
    debug "cleanShutdown()"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.RUNNING
          reject "VM not in #{VM.POWER_STATES.RUNNING} power state."
        else
          session.request("VM.clean_shutdown", [@opaqueRef]).then (value) =>
            resolve()
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  clone: (name) =>
    debug "clone(#{name})"
    new Promise (resolve, reject) =>
      @refreshPowerState().then (currentPowerState) =>
        unless currentPowerState == VM.POWER_STATES.HALTED
          reject "VM not in #{VM.POWER_STATES.HALTED} power state."
        else
          session.request("VM.clone", [@opaqueRef, name]).then (value) =>
            xenAPI.vmCollection.findOpaqueRef(value).then (clonedVM) ->
              resolve clonedVM
            .catch (e) ->
              debug e
              reject e
          .catch (e) ->
            debug e
            reject e
      .catch (e) ->
        debug e
        reject e

  getVBDs: =>
    debug "getVBDs()"
    new Promise (resolve, reject) =>
      vbdSearchPromises = []
      _.each @VBDs, (vbd) ->
        vbdSearchPromise = xenAPI.vbdCollection.findOpaqueRef(vbd)
        vbdSearchPromises.push vbdSearchPromise

      Promise.all(vbdSearchPromises).then (vbdObjects) ->
        debug vbdObjects
        resolve(vbdObjects)
      .catch (e) ->
        debug e
        reject e

  getVIFs: =>
    debug "getVIFs()"
    new Promise (resolve, reject) =>
      vifSearchPromises = []
      _.each @VIFs, (vif) ->
        vifSearchPromise = xenAPI.vifCollection.findOpaqueRef(vif)
        vifSearchPromises.push vifSearchPromise

      Promise.all(vifSearchPromises).then (vifObjects) ->
        debug vifObjects
        resolve(vifObjects)
      .catch (e) ->
        debug e
        reject e

  getMetrics: =>
    debug "getMetrics()"
    new Promise (resolve, reject) =>
      xenAPI.metricsCollection.findOpaqueRef(@metrics).then (metrics) =>
        resolve(metrics);
      .catch (e) ->
        debug e
        reject e

  getGuestMetrics: =>
    debug "getGuestMetrics()"
    new Promise (resolve, reject) =>
      xenAPI.guestMetricsCollection.findOpaqueRef(@guest_metrics).then (guest_metrics) =>
        resolve(guest_metrics);
      .catch (e) ->
        debug e
        reject e

  getConsoles: =>
    debug "getConsoles()"
    new Promise (resolve, reject) =>
      consoleSearchPromises = []
      _.each @consoles, (console) ->
        consoleSearchPromise = xenAPI.consoleCollection.findOpaqueRef(console)
        consoleSearchPromises.push consoleSearchPromise

      Promise.all(consoleSearchPromises).then (consoleObjects) ->
        debug consoleObjects
        resolve(consoleObjects)
      .catch (e) ->
        debug e
        reject e

  setMemoryStaticMax: (max) =>
    debug "setMemoryStaticMax(#{max})"
    new Promise (resolve, reject) =>
      session.request("VM.set_memory_static_max", [@opaqueRef, max]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  setMemoryStaticMin: (min) =>
    debug "setMemoryStaticMin(#{min})"
    new Promise (resolve, reject) =>
      session.request("VM.set_memory_static_min", [@opaqueRef, min]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  setMemoryDynamicMax: (max) =>
    debug "setMemoryDynamicMax(#{max})"
    new Promise (resolve, reject) =>
      session.request("VM.set_memory_dynamic_max", [@opaqueRef, max]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  setMemoryDynamicMin: (min) =>
    debug "setMemoryDynamicMin(#{min})"
    new Promise (resolve, reject) =>
      session.request("VM.set_memory_dynamic_min", [@opaqueRef, min]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  setStartupCPUs: (count) =>
    debug "setStartupCPUs(#{count})"
    new Promise (resolve, reject) =>
      session.request("VM.set_VCPUs_at_startup", [@opaqueRef, count]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  setVCPUMax: (count) =>
    debug "setVCPUMax(#{count})"
    new Promise (resolve, reject) =>
      session.request("VM.set_VCPUs_max", [@opaqueRef, count]).then (value) =>
        resolve()
      .catch (e) ->
        debug e
        reject e

  convertToTemplate: =>
    debug "convertToTemplate()"
    new Promise (resolve, reject) =>
      session.request("VM.set_is_a_template", [@opaqueRef, true]).then (value) =>
        xenAPI.templateCollection.findOpaqueRef(@opaqueRef).then (template) ->
          resolve(template)
      .catch (e) ->
        debug e
        reject e

  VM.POWER_STATES =
    HALTED: 'Halted',
    PAUSED: 'Paused',
    RUNNING: 'Running',
    SUSPENDED: 'Suspended'

  VM.DEFAULT_CONFIG =
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

module.exports = VM

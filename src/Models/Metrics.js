/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Metrics');
const Promise = require('bluebird');

var Metrics = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Metrics = class Metrics {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct Metrics
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   metrics - A JSON object representing this Metrics
    * @param      {String}   opaqueRef - The OpaqueRef handle to this Metrics
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _metrics, _opaqueRef, _xenAPI) {
      debug("constructor()");
      debug(_metrics, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_metrics) {
        throw Error("Must provide `metrics`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _metrics.uuid;
      this.memory_actual = _metrics.memory_actual;
      this.start_time = _metrics.start_time;
      this.VCPUs_number = _metrics.VCPUs_number;
    }
  };
  Metrics.initClass();
  return Metrics;
})();


module.exports = Metrics;

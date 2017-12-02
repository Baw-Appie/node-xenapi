/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:MetricsCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var MetricsCollection = (function() {
  let Metrics = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createMetricsInstance = undefined;
  MetricsCollection = class MetricsCollection {
    static initClass() {
      Metrics = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createMetricsInstance = (metrics, opaqueRef) => {
        return new Metrics(session, metrics, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct MetricsCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Metrics - Dependency injection of the Metrics class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _metrics, _xenAPI) {
      this.list = this.list.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_metrics) {
        throw Error("Must provide Metrics");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Metrics = _metrics;
    }

    /**
    * List all Metrics
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("VM_metrics.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          Metrics = _.map(value, createMetricsInstance);
          return resolve(_.filter(Metrics, metrics => metrics));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        const query = `field "uuid"="${uuid}"`;
        return session.request("VM_metrics.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          Metrics = _.map(value, createMetricsInstance);
          const filtered = _.filter(Metrics, metrics => metrics);
          if (filtered.length > 1) {
            return reject(`Multiple Metrics for UUID ${uuid}`);
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

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VM_metrics.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const metric = createMetricsInstance(value, opaqueRef);
          return resolve(metric);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  MetricsCollection.initClass();
  return MetricsCollection;
})();

module.exports = MetricsCollection;

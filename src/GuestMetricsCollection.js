/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:GuestMetricsCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var GuestMetricsCollection = (function() {
  let GuestMetrics = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createGuestMetricsInstance = undefined;
  GuestMetricsCollection = class GuestMetricsCollection {
    static initClass() {
      GuestMetrics = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createGuestMetricsInstance = (guestmetrics, opaqueRef) => {
        return new GuestMetrics(session, guestmetrics, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct GuestMetricsCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   GuestMetrics - Dependency injection of the GuestMetrics class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _guestMetrics, _xenAPI) {
      this.list = this.list.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_guestMetrics) {
        throw Error("Must provide GuestMetrics");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      GuestMetrics = _guestMetrics;
    }

    /**
    * List all GuestMetrics
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("VM_guest_metrics.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          GuestMetrics = _.map(value, createGuestMetricsInstance);
          return resolve(_.filter(GuestMetrics, guestmetrics => guestmetrics));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        return this.list().then(GuestMetrics => {
          const matchGuestMetricsuuid = function(guestmetrics) {
            if (guestmetrics.uuid === uuid) {
              return guestmetrics;
            }
          };

          const matches = _.map(GuestMetrics, matchGuestMetricsuuid);
          return resolve(_.filter(matches, guestmetrics => guestmetrics));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findOpaqueRef(opaqueRef) {
      debug(`findOpaqueRef(${opaqueRef})`);
      return new Promise((resolve, reject) => {
        return session.request("VM_guest_metrics.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const template = createGuestMetricsInstance(value, opaqueRef);
          return resolve(template);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  GuestMetricsCollection.initClass();
  return GuestMetricsCollection;
})();

module.exports = GuestMetricsCollection;

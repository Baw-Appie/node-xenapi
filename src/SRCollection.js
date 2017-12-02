/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:SRCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var SRCollection = (function() {
  let SR = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createSRInstance = undefined;
  SRCollection = class SRCollection {
    static initClass() {
      SR = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createSRInstance = (sr, opaqueRef) => {
        return new SR(session, sr, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct SRCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   SR - Dependency injection of the SR class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _SR, _xenAPI) {
      this.list = this.list.bind(this);
      this.findNamed = this.findNamed.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_SR) {
        throw Error("Must provide SR");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      SR = _SR;
    }

    /**
    * List all SRs
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("SR.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const SRs = _.map(value, createSRInstance);
          return resolve(_.filter(SRs, sr => sr));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findNamed(name) {
      debug(`findNamed(${name})`);
      return new Promise((resolve, reject) => {
        return this.list().then(SRs => {
          const matchSRName = function(sr) {
            if (minimatch(sr.name, name, {nocase: true})) {
              return sr;
            }
          };

          const matches = _.map(SRs, matchSRName);
          return resolve(_.filter(matches, sr => sr));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        return this.list().then(SRs => {
          const matchSRuuid = function(sr) {
            if (sr.uuid === uuid) {
              return sr;
            }
          };

          const matches = _.map(SRs, matchSRuuid);
          const filtered = _.filter(matches, sr => sr);
          if (filtered.length > 1) {
            return reject(`Multiple SRs for UUID ${uuid}`);
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
        return session.request("SR.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const template = createSRInstance(value, opaqueRef);
          return resolve(template);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  SRCollection.initClass();
  return SRCollection;
})();

module.exports = SRCollection;

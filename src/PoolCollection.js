/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:PoolCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var PoolCollection = (function() {
  let Pool = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createPoolInstance = undefined;
  PoolCollection = class PoolCollection {
    static initClass() {
      Pool = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createPoolInstance = (pool, opaqueRef) => {
        return new Pool(session, pool, opaqueRef, xenAPI);
      };
    }

    /**
    * Construct PoolCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Pool - Dependency injection of the Pool class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _Pool, _xenAPI) {
      this.list = this.list.bind(this);
      this.findUUID = this.findUUID.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_Pool) {
        throw Error("Must provide Pool");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Pool = _Pool;
    }

    /**
    * List all Pools
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("pool.get_all_records").then(value => {
          if (!value) {
            reject();
          }

          debug(`Received ${Object.keys(value).length} records`);

          const Pools = _.map(value, createPoolInstance);
          return resolve(_.filter(Pools, pool => pool));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        return this.list().then(Pools => {
          const matchPooluuid = function(pool) {
            if (pool.uuid === uuid) {
              return pool;
            }
          };

          const matches = _.map(Pools, matchPooluuid);
          const filtered = _.filter(matches, pool => pool);
          if (filtered.length > 1) {
            return reject(`Multiple Pools for UUID ${uuid}`);
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
  PoolCollection.initClass();
  return PoolCollection;
})();

module.exports = PoolCollection;

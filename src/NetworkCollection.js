/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:NetworkCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var NetworkCollection = (function() {
  let Network = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createNetworkInstance = undefined;
  NetworkCollection = class NetworkCollection {
    static initClass() {
      Network = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createNetworkInstance = (network, opaqueRef) => {
        if (!network.other_config ||
          (!network.other_config.is_guest_installer_network &&
            !network.other_config.is_host_internal_management_network)) {
          return new Network(session, network, opaqueRef, xenAPI);
        }
      };
    }

    /**
    * Construct NetworkCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Network - Dependency injection of the Network class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _Network, _xenAPI) {
      this.list = this.list.bind(this);
      this.findNamed = this.findNamed.bind(this);
      this.findUUID = this.findUUID.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_Network) {
        throw Error("Must provide Network");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Network = _Network;
    }

    /**
     * List all Networks
     * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("network.get_all_records").then(value => {
          if (!value) {
            reject();
          }
          debug(`Received ${Object.keys(value).length} records`);

          const Networks = _.map(value, createNetworkInstance);
          return resolve(_.filter(Networks, network => network));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findNamed(name) {
      debug(`findNamed(${name})`);
      return new Promise((resolve, reject) => {
        return this.list().then(networks => {
          const matchNetworkName = function(network) {
            if (minimatch(network.name, name, {nocase: true})) {
              return network;
            }
          };

          const matches = _.map(networks, matchNetworkName);
          return resolve(_.filter(matches, network => network));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findUUID(uuid) {
      debug(`findUUID(${uuid}`);
      return new Promise((resolve, reject) => {
        return this.list().then(Networks => {
          const matchNetworkUuid = function(network) {
            if (network.uuid === uuid) {
              return network;
            }
          };

          const matches = _.map(Networks, matchNetworkUuid);
          const filtered = _.filter(matches, network => network);
          if (filtered.length > 1) {
            return reject(`Multiple Networks for UUID ${uuid}`);
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
  NetworkCollection.initClass();
  return NetworkCollection;
})();

module.exports = NetworkCollection;

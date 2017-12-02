/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:TemplateCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var TemplateCollection = (function() {
  let Template = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createTemplateInstance = undefined;
  TemplateCollection = class TemplateCollection {
    static initClass() {
      Template = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createTemplateInstance = (template, opaqueRef) => {
        if (template && template.is_a_template && !template.is_control_domain) {
          return new Template(session, template, opaqueRef, xenAPI);
        }
      };
    }

    /**
    * Construct TemplateCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Template - Dependency injection of the Template class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _Template, _xenAPI) {
      this.list = this.list.bind(this);
      this.listCustom = this.listCustom.bind(this);
      this.findNamed = this.findNamed.bind(this);
      this.findUUID = this.findUUID.bind(this);
      this.findOpaqueRef = this.findOpaqueRef.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_Template) {
        throw Error("Must provide Template");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Template = _Template;
    }

    /**
    * List all Templates
    * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        const query = 'field "is_a_template" = "true"';
        return session.request("VM.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }
          debug(`Received ${Object.keys(value).length} records`);

          const Templates = _.map(value, createTemplateInstance);
          return resolve(_.filter(Templates, template => template));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    listCustom() {
      debug("listCustom()");
      return new Promise((resolve, reject) => {
        const query = 'field "is_a_template" = "true"';
        return session.request("VM.get_all_records_where", [query]).then(value => {
          if (!value) {
            reject();
          }
          debug(`Received ${Object.keys(value).length} records`);

          const filteredValues = _.mapValues(value, function(template) {
            if (!template.other_config.default_template) {
              return template;
            }
          });

          const Templates = _.map(filteredValues, createTemplateInstance);
          return resolve(_.filter(Templates, template => template));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    findNamed(name) {
      debug(`findNamed(${name})`);
      return new Promise((resolve, reject) => {
        return this.list().then(templates => {
          const matchTemplateName = function(template) {
            if (minimatch(template.name, name, {nocase: true})) {
              return template;
            }
          };

          const matches = _.map(templates, matchTemplateName);
          return resolve(_.filter(matches, template => template));
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

          const Templates = _.map(value, createTemplateInstance);
          const filtered = _.filter(Templates, template => template);
          if (filtered.length > 1) {
            return reject(`Multiple Templates for UUID ${uuid}`);
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
        return session.request("VM.get_record", [opaqueRef]).then(value => {
          if (!value) {
            reject();
          }

          const template = createTemplateInstance(value, opaqueRef);
          return resolve(template);
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  TemplateCollection.initClass();
  return TemplateCollection;
})();

module.exports = TemplateCollection;

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:TaskCollection');
const Promise = require('bluebird');
const minimatch = require('minimatch');
const _ = require('lodash');

var TaskCollection = (function() {
  let Task = undefined;
  let session = undefined;
  let xenAPI = undefined;
  let createTaskInstance = undefined;
  TaskCollection = class TaskCollection {
    static initClass() {
      Task = undefined;
      session = undefined;
      xenAPI = undefined;
  
      createTaskInstance = (task, opaqueRef) => {
        try {
          return new Task(session, task, opaqueRef, xenAPI);
        } catch (error) {
          return null;
        }
      };
    }

    /**
    * Construct TaskCollection
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   Task - Dependency injection of the Task class.
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _Task, _xenAPI) {
      this.list = this.list.bind(this);
      this.show = this.show.bind(this);
      debug("constructor()");
      if (!_session) {
        throw Error("Must provide session");
      }
      if (!_Task) {
        throw Error("Must provide Task");
      }
      if (!_xenAPI) {
        throw Error("Must provide xenAPI");
      }

      //These can safely go into shared class scope because this constructor is only called once.
      session = _session;
      xenAPI = _xenAPI;
      Task = _Task;
    }


    /**
     * List all Tasks
     * @return     {Promise}
    */
    list() {
      debug("list()");
      return new Promise((resolve, reject) => {
        return session.request("task.get_all_records").then(value => {
          if (!value) {
            reject();
          }
          debug(`Received ${Object.keys(value).length} records`);

          const Tasks = _.map(value, createTaskInstance);
          return resolve(_.filter(Tasks, task => task));
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }

    /**
     * Show Task by UUID
     * @param		{String}	uuid - The UUID of the Task to show.
     * @return		{Promise}
    */
    show(uuid) {
      debug(`list(${uuid})`);
      return new Promise((resolve, reject) => {
        return session.request("task.get_by_uuid", [uuid]).then(opaqueRef => {
          if (!opaqueRef) {
            reject();
          }
          return session.request("task.get_record", [opaqueRef]).then(task => {
            if (!task) {
              reject();
            }
            debug(task);
            let newTask = null;
            try {
              return newTask = new Task(session, task, opaqueRef);
            } finally {
              resolve(newTask);
            }
        }).catch(function(e) {
            debug(e);
            return reject(e);
          });
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  TaskCollection.initClass();
  return TaskCollection;
})();

module.exports = TaskCollection;

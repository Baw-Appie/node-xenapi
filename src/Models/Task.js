/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Task');
const Promise = require('bluebird');
const _ = require('lodash');

var Task = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Task = class Task {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
  
      Task.STATUS = {
        PENDING: "pending",
        SUCCESS: "success",
        FAILURE: "failure",
        CANCELLING: "cancelling",
        CANCELLED: "cancelled"
      };
  
      Task.ALLOWED_OPERATIONS =
        {CANCEL: "cancel"};
    }

    /**
    * Construct Task
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   task - A JSON object representing this Task
    * @param      {String}   opaqueRef - The OpaqueRef handle to this Task
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _task, _opaqueRef, _xenAPI) {
      this.cancel = this.cancel.bind(this);
      debug("constructor()");
      debug(_task, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_task) {
        throw Error("Must provide `task`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }
      if (!_xenAPI) {
        throw Error("Must provide `xenAPI`");
      }

      if (!_task.allowed_operations || !_task.status) {
        throw Error("`task` does not describe a valid Task");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _task.uuid;
      this.name = _task.name_label;
      this.description = _task.name_description;
      this.allowed_operations = _task.allowed_operations;
      this.status = _task.status;
      this.created = _task.created;
      this.finished = _task.finished;
      this.progress = _task.progress;
    }

    cancel() {
      debug("cancel()");

      return new Promise((resolve, reject) => {
        if (!_.contains(this.allowed_operations, Task.ALLOWED_OPERATIONS.CANCEL)) {
          reject(new Error("Operation is not allowed"));
          return;
        }

        return session.request("task.cancel", [this.opaqueRef]).then(value => {
          debug(value);
          return resolve();
      }).catch(function(e) {
          debug(e);
          return reject(e);
        });
      });
    }
  };
  Task.initClass();
  return Task;
})();

module.exports = Task;

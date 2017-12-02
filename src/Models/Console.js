/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const debug = require('debug')('XenAPI:Console');
const Promise = require('bluebird');
const net = require('net');
const url = require('url');

var Console = (function() {
  let session = undefined;
  let xenAPI = undefined;
  Console = class Console {
    static initClass() {
      session = undefined;
      xenAPI = undefined;
    }

    /**
    * Construct Console
    * @class
    * @param      {Object}   session - An instance of Session
    * @param      {Object}   cosnole - A JSON object representing this Console
    * @param      {String}   opaqueRef - The OpaqueRef handle to this Console
    * @param      {Object}   xenAPI - An instance of XenAPI
    */
    constructor(_session, _console, _opaqueRef, _xenAPI) {
      this.connect = this.connect.bind(this);
      debug("constructor()");
      debug(_console, _opaqueRef);

      if (!_session) {
        throw Error("Must provide `session`");
      }
      if (!_console) {
        throw Error("Must provide `console`");
      }
      if (!_opaqueRef) {
        throw Error("Must provide `opaqueRef`");
      }

      //These can safely go into class scope because there is only one instance of each.
      session = _session;
      xenAPI = _xenAPI;

      this.opaqueRef = _opaqueRef;
      this.uuid = _console.uuid;
      this.protocol = _console.protocol;
      this.other_config = _console.other_config;
      this.location = _console.location;
    }

    connect() {
      debug("connect()");
      return new Promise((resolve, reject) => {
        const parsedLocation = url.parse(this.location);

        const options = {
          host: parsedLocation.host,
          port: 80
        };

        var socket = net.connect(options, () => {
          return socket.write(`CONNECT ${parsedLocation.path}&session_id=${session.sessionID} HTTP/1.0\r\n\r\n`);
        });

        return socket.on('readable', () => {
          //The first 78 bytes are HTTP response and are not needed
          const N = 78;
          const chunk = socket.read(N);

          if (chunk.toString().indexOf("HTTP/1.1 200 OK") === 0) {
            socket.removeAllListeners('readable');
            //It is now safe for someone to take the socket and listen for 'data', as the HTTP junk is gone.
            return resolve(socket);
          }
        });
      });
    }
  };
  Console.initClass();
  return Console;
})();

module.exports = Console;

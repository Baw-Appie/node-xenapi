// Generated by CoffeeScript 1.9.1
(function() {
  var Promise, chai, chaiAsPromised, expect, sinon, sinonChai;

  chai = require('chai');

  chaiAsPromised = require('chai-as-promised');

  expect = chai.expect;

  sinon = require('sinon');

  sinonChai = require('sinon-chai');

  Promise = require('bluebird');

  chai.use(sinonChai);

  chai.use(chaiAsPromised);

  describe("VIF", function() {
    var VIF, XenAPI, session;
    session = void 0;
    VIF = void 0;
    XenAPI = void 0;
    beforeEach(function() {
      session = {
        request: function() {}
      };
      VIF = require('../../lib/Models/VIF');
      return XenAPI = {
        'session': session
      };
    });
    return describe("constructor", function() {
      var key;
      key = void 0;
      beforeEach(function() {
        return key = 'OpaqueRef:abcd';
      });
      afterEach(function() {});
      it("should throw unless session is provided", function() {
        return expect(function() {
          return new VIF();
        }).to["throw"](/Must provide `session`/);
      });
      it("should throw unless vif is provided", function() {
        return expect(function() {
          return new VIF(session);
        }).to["throw"](/Must provide `vif`/);
      });
      it("should throw unless opaqueRef is provided", function() {
        return expect(function() {
          return new VIF(session, {});
        }).to["throw"](/Must provide `opaqueRef`/);
      });
      return it("should throw unless xenAPI is provided", function() {
        return expect(function() {
          return new VIF(session, {}, "OpaqueRef");
        }).to["throw"](/Must provide `xenAPI`/);
      });
    });
  });

}).call(this);

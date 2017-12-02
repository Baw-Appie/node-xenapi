const APIClient = require('./APIClient');
const ConsoleCollection = require('./ConsoleCollection');
const Console = require('./Models/Console');
const GuestMetricsCollection = require('./GuestMetricsCollection');
const GuestMetrics = require('./Models/GuestMetrics');
const MetricsCollection = require('./MetricsCollection');
const Metrics = require('./Models/Metrics');
const NetworkCollection = require('./NetworkCollection');
const Network = require('./Models/Network');
const PoolCollection = require('./PoolCollection');
const Pool = require('./Models/Pool');
const Session = require('./Models/Session');
const SRCollection = require('./SRCollection');
const SR = require('./Models/SR');
const TaskCollection = require('./TaskCollection');
const Task = require('./Models/Task');
const TemplateCollection = require('./TemplateCollection');
const Template = require('./Models/Template');
const VBDCollection = require('./VBDCollection');
const VBD = require('./Models/VBD');
const VDICollection = require('./VDICollection');
const VDI = require('./Models/VDI');
const VIFCollection = require('./VIFCollection');
const VIF = require('./Models/VIF');
const VMCollection = require('./VMCollection');
const VM = require('./Models/VM');
const xmlrpc = require('xmlrpc');

module.exports = function(options) {
  const apiClient = new APIClient(xmlrpc, options);
  const session = new Session(apiClient);

  const xenAPI = {
    session
  };

  const consoleCollection = new ConsoleCollection(session, Console, xenAPI);
  const guestMetricsCollection = new GuestMetricsCollection(session, GuestMetrics, xenAPI);
  const metricsCollection = new MetricsCollection(session, Metrics, xenAPI);
  const networkCollection = new NetworkCollection(session, Network, xenAPI);
  const poolCollection = new PoolCollection(session, Pool, xenAPI);
  const srCollection = new SRCollection(session, SR, xenAPI);
  const taskCollection = new TaskCollection(session, Task, xenAPI);
  const templateCollection = new TemplateCollection(session, Template, xenAPI);
  const vbdCollection = new VBDCollection(session, VBD, xenAPI);
  const vdiCollection = new VDICollection(session, VDI, xenAPI);
  const vifCollection = new VIFCollection(session, VIF, xenAPI);
  const vmCollection = new VMCollection(session, VM, xenAPI);

  xenAPI.consoleCollection = consoleCollection;
  xenAPI.guestMetricsCollection = guestMetricsCollection;
  xenAPI.metricsCollection = metricsCollection;
  xenAPI.networkCollection = networkCollection;
  xenAPI.poolCollection = poolCollection;
  xenAPI.srCollection = srCollection;
  xenAPI.taskCollection = taskCollection;
  xenAPI.templateCollection = templateCollection;
  xenAPI.vbdCollection = vbdCollection;
  xenAPI.vdiCollection = vdiCollection;
  xenAPI.vifCollection = vifCollection;
  xenAPI.vmCollection = vmCollection;

  xenAPI.models = {
    Console,
    GuestMetrics,
    Metrics,
    Network,
    Pool,
    SR,
    Task,
    VBD,
    VDI,
    VIF,
    VM
  };

  return xenAPI;
};

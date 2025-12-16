
const API = require('../api');
//const VantageManager = require('./VantageManager');
const ServiceFactory = require('./ServiceFactory');
exports = module.exports = PluginAccessory;

function PluginAccessory(platform, serialNumber, services, content, custom) {
    //console.log('Init VantageAccessory');
    //console.log(services);
    //console.log(content);

    //this.Name =  services.InfoName + '-' + services.SwitchName;
    this.name = serialNumber;
    this.services = services;
    this.content = content;
    this.custom = custom;

    this.Platform = platform;

    //console.log(this);
    //VantageManager.pushAccessory(this);
}

PluginAccessory.prototype.getServices = function (factory) {

    let informationService = factory.GetDefaultInfoService();
    let switchService = null;

    switchService = factory.GetDefaultSwitchService(
        this.services.InfoName,
        this.services.InfoSubType,
        this.services.SwitchName);

    let services = [informationService, switchService];

    try {
        ServiceFactory.SetServices(this, services);
        API.logger.info(this.services.SwitchName +'SetServices was Finish');
    } catch (err) {
        API.error.push(err);
        API.logger.error(err);
    }

    return services;
}

// VantageAccessory.prototype.run = function () {

// }
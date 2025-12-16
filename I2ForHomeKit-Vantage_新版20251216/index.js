var path = require('path');

const API = require('./api');

const PluginWebRoute = require('./web/routes/route');
const PluginPlatform = require('./lib/PluginPlatform');
const PluginAccessory = require('./lib/PluginAccessory');

exports = module.exports = function Initializer(i2ForHomeKit, pluginRegister, pluginName, logger) {

    API.core = i2ForHomeKit;
    API.IdentifyContainer = i2ForHomeKit.IdentifyContainer;

    API.HAP = i2ForHomeKit.HAP;
    API.ServiceFactory = i2ForHomeKit.ServiceFactory;
    API.logger = logger; //訊息紀錄
    API.error = [];

    logger.info(pluginName + '- Initializer!');

    pluginRegister.registerRouteLink(pluginName, PluginWebRoute);

    pluginRegister.registerPlatform(pluginName, PluginPlatform);

    pluginRegister.registerAccessory(pluginName, PluginAccessory);
}

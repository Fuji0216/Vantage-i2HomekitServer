var path = require('path');

const API = require('./api');
const VantageManager = require('./lib/VantageManager');

const PluginPlatform = require('./lib/PluginPlatform');
const PluginAccessory = require('./lib/PluginAccessory');

exports = module.exports = function VantageInitializer(i2ForHomeKit, pluginRegister, logger) {

    let pluginName = 'Vantage';

    logger.info(pluginName + ' Initializer!');
    
    API.AccessoryContainer = i2ForHomeKit.AccessoryContainer;

    API.HAP = i2ForHomeKit.HAP;
    API.Events = i2ForHomeKit.Events;

    API.pluginDB = i2ForHomeKit.DB.registerPlugin(
        pluginName,
        path.join(__dirname, './config.json'),
        logger);

    API.logger = logger; //訊息紀錄

    API.error = [];

    pluginRegister.registerRouteLink(pluginName, require('./web/routes/route'));

    pluginRegister.registerPlatform(pluginName, PluginPlatform);

    pluginRegister.registerAccessory(pluginName, PluginAccessory);

    API.Events.on('didFinishLaunching', function () {
        VantageManager.runProcess();
    });
}

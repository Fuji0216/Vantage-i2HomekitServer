const API = require('../api');
//const VantageManager = require('./VantageManager');
const TCPClient = require('i2_socketService').TCPClient;
const PluginCommand = require('./PluginCommand');
const VIDHeadManager = require('./AccessoryContent/VIDHeadManager').VIDHeadManager;
const VariableBoolManager = require('./AccessoryContent/VariableBoolManager').VariableBoolManager;

exports = module.exports = PluginPlatform;

function PluginPlatform(serialNumber, content, custom) {
    //console.log('Init VantagePlatform');
    //console.log(content);
    this.name = serialNumber;
    this.content = content;
    this.custom = custom;
    this.error = [];

    if (content['TCPClient'] !== undefined) {
        let clientConfig = new TCPClient.Config;
        clientConfig.IP = content['TCPClient'].IP;
        clientConfig.Port = content['TCPClient'].Port;
        clientConfig.IsReconnect = true;
        clientConfig.ReconnectMode = TCPClient.ReconnectMode.SlowDown;
        clientConfig.Reconnect_SlowDown_Step = 2000;
        clientConfig.Reconnect_SlowDown_MaxInterval = 15000;

        clientConfig.HandshakeMessage.push('STATUS VARIABLE\r'); //變數 主動回饋請求
        clientConfig.HandshakeMessage.push('STATUS LOAD\r'); //燈光 主動回饋請求
        clientConfig.HandshakeMessage.push('STATUS THERMOP\r'); //冷氣 主動回饋請求
        clientConfig.HandshakeMessage.push('STATUS TEMP\r'); //冷氣 主動回饋請求
        clientConfig.HandshakeMessage.push('STATUS BLIND\r'); //冷氣 主動回饋請求
        this.device = new TCPClient(clientConfig, PluginCommand.Analyze.bind(this), API.logger);
    } else {
        throw new Error("Config " + index + " does not contain a TCPClient info.");
    }

    //VantageManager.pushPlatform(this);
    
    this.GenerialManager = new API.AccessoryContainer.GenerialManager();
    this.VIDHeadManager = new VIDHeadManager();
    this.VariableBoolManager = new VariableBoolManager();

    this.device.Open();
}

// VantagePlatform.prototype.run = function () {
// }

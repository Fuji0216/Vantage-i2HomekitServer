const API = require('../api');
const PluginCommand = require('./PluginCommand');

const TCPClient = require('i2_socketService').TCPClient;

exports = module.exports = PluginPlatform;
function PluginPlatform(serialNumber, content, custom) {

    this.name = serialNumber;
    this.content = content;
    this.custom = custom;
    this.error = [];

    let that = this;

    if (content['TCPClient'] !== undefined) {
        let l_clientConfig = new TCPClient.Config;
        l_clientConfig.IP = content['TCPClient'].IP;
        l_clientConfig.Port = content['TCPClient'].Port;
        l_clientConfig.IsReconnect = true;
        l_clientConfig.ReconnectMode = TCPClient.ReconnectMode.SlowDown;
        l_clientConfig.Reconnect_SlowDown_Step = 2000;
        l_clientConfig.Reconnect_SlowDown_MaxInterval = 15000;

        l_clientConfig.HandshakeMessage.push('STATUS VARIABLE\r'); //變數 主動回饋請求
        l_clientConfig.HandshakeMessage.push('STATUS LOAD\r'); //燈光 主動回饋請求
        l_clientConfig.HandshakeMessage.push('STATUS THERMOP\r'); //冷氣 主動回饋請求
        l_clientConfig.HandshakeMessage.push('STATUS TEMP\r'); //冷氣 主動回饋請求
        l_clientConfig.HandshakeMessage.push('STATUS BLIND\r'); //冷氣 主動回饋請求
        this.device = new TCPClient(l_clientConfig, PluginCommand.Analyze.bind(this), API.logger);
    } else {
        throw new Error("Config " + this.name + " does not contain a TCPClient info.");
    }
    
    this.Container = API.IdentifyContainer.Register(this);

    API.core.Events.on('didFinishLaunching',function(data){
        that.device.Open();
    });
    
}

// VantagePlatform.prototype.run = function () {
// }

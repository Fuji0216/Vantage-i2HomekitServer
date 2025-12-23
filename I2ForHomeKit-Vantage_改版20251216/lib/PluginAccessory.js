const Api = require('../api');

const PM01_Li_T01 = require('./AccessoryServices/Lightbulb/PM01_Li_T01');
const PM01_Sw_T01 = require('./AccessoryServices/Switch/PM01_Sw_T01');
const PM01_Sw_T02 = require('./AccessoryServices/Switch/PM01_Sw_T02');
const PM01_WiCo_T02 = require('./AccessoryServices/Window_Covering/PM01-WiCo-T02');
// [新增] 引入 Task 模式的窗簾邏輯
const PM01_WiCo_Task = require('./AccessoryServices/Window_Covering/PM01-WiCo-Task');

exports = module.exports = PluginAccessory;
function PluginAccessory(platform, serialNumber, services, content, custom) {
    this.services = services;
    this.content = content;
    this.custom = custom;
    this.serialNumber = serialNumber;

    this.Platform = platform;
}

PluginAccessory.prototype.setServices = function (accessory, apLoader) {
    try {
        this.apLoader = apLoader;

        let script = this.services.InfoName + "-" + this.services.InfoSubType;

        switch (script) {
            case "Lightbulb-Load":
                PM01_Li_T01(this, accessory, apLoader);
                break;
            case "Switch-Variable_Task":
                PM01_Sw_T01(this, accessory, apLoader);
                break;
            case "Switch-Momentary_Task":
                PM01_Sw_T02(this, accessory, apLoader);
                break;
            case "Window_Covering-Blind":
                PM01_WiCo_T02(this, accessory, apLoader);
                break;
            // [新增] 這裡必須加入 Case，否則程式不知道要執行新檔案
            case "Window_Covering-Task":
                PM01_WiCo_Task(this, accessory, apLoader);
                break;
            default:
                break;
        }

        Api.logger.info(this.services.SwitchName + 'SetServices was Finish');
        return 1;
    } catch (err) {
        Api.error.push(err);
        Api.logger.error(err);
    }
    return 0;
}
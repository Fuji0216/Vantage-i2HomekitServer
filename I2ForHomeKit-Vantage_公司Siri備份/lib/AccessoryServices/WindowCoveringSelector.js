
const PM01_WiCo_T01 = require('./PM01_WiCo_T01');
const PM01_WiCo_T02 = require('./PM01_WiCo_T02');


exports.SetServices = function (currentAccessory, services) {

    switch (currentAccessory.services.InfoSubType) {
        case "Task":
            PM01_WiCo_T01(currentAccessory, services);
            break;
        case "Blind":
            PM01_WiCo_T02(currentAccessory, services);
            break;
        default:
            break;
    }
}
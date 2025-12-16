
const PM01_Li_T01 = require('./PM01_Li_T01');
const PM01_Li_T02 = require('./PM01_Li_T02');
const PM01_Li_T03 = require('./PM01_Li_T03');

exports.SetServices = function (currentAccessory, services) {

    switch (currentAccessory.services.InfoSubType) {
        case "Load":
            PM01_Li_T01(currentAccessory, services);
            break;
        case "Dynamic_Task":
            PM01_Li_T02(currentAccessory, services);
            break;
        case "RampLoad":
            PM01_Li_T03(currentAccessory, services);
            break;
        default:
            break;
    }
}

const PM01_Sw_T01 = require('./PM01_Sw_T01');
const PM01_Sw_T02 = require('./PM01_Sw_T02');


exports.SetServices = function (currentAccessory, services) {

    switch (currentAccessory.services.InfoSubType) {
        case "Variable_Task":
            PM01_Sw_T01(currentAccessory, services);
            break;
        case "Momentary_Task":
            PM01_Sw_T02(currentAccessory, services);
            break;
        default:
            break;
    }
}
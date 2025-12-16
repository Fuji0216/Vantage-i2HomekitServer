const LightbulbSelector = require('./AccessoryServices/LightbulbSelector');
const SwitchbSelector = require('./AccessoryServices/SwitchSelector');
const WindowCoveringSelector = require('./AccessoryServices/WindowCoveringSelector');

const PM01_Tm_T01 = require('./AccessoryServices/PM01_Tm_T01');

exports.SetServices = function (currentAccessory, services) {

    if (currentAccessory.APLoader === undefined)
        throw new Error(currentAccessory.name + " does not contain a APLoader.");

    switch (currentAccessory.services.InfoName) {
        case "Lightbulb":
            LightbulbSelector.SetServices(currentAccessory, services);
            // if (vantageAccessory.services.InfoSubType == 'Custom')
            //     VantageTask.SetServices(vantageAccessory, services);
            // else
            //     VantageLightbulb.SetServices(vantageAccessory, services);
            break;
        case "Thermostat":
            PM01_Tm_T01.SetServices(currentAccessory, services);
            break;
        case "Window_Covering":
            WindowCoveringSelector.SetServices(currentAccessory, services);
            break;
        case "Switch":
            SwitchbSelector.SetServices(currentAccessory, services);
            break;
        default:
            break;
    }
}

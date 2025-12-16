const Api = require('../../../api');
const PluginCommand = require('../../PluginCommand');

exports = module.exports = SetServices;

function SetServices(self, accessory, apLoader) {

    let theDevice = self.Platform.device;
    let theOptional = self.services.Switch;
    /////////////////////////////////////////////////////////////

    let theTask_VID = self.content.Task_VID;

    let l_accessoryInformation = accessory.getService(Api.HAP.Service.AccessoryInformation);

    l_accessoryInformation
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Switch Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01_Sw_T02");

    let l_Switch_On = null;
    /////////////////////////////////////////////////////////////

    let On = {
        // format: Formats.BOOL,
        // perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
    }

    /////////////////////////////////////////////////////////////

    let acc_Switch = accessory.addService(Api.HAP.Service.Switch, self.services.SwitchName)

    var timeoutID;
    l_Switch_On = apLoader.Add(Api.HAP.Categories.SWITCH, 0,
        acc_Switch.getCharacteristic(Api.HAP.Characteristic.On)
            .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {

                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                l_Switch_On.SetValue(value);
                ////////////////////////////////

                clearTimeout(timeoutID);
                timeoutID = setTimeout(function () {
                    PluginCommand.Command.Task(theDevice, theTask_VID);
                    // 彈回關閉狀態
                    l_Switch_On.UpdateCharacteristic(false);
                }, 1000);
                ////////////////////////////////
                callback();
            })
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {

                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                callback(null, l_Switch_On.GetValue());
            }));
}
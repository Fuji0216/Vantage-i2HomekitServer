const Api = require('../../../api');
const PluginCommand = require('../../PluginCommand');

exports = module.exports = SetServices;

function SetServices(self, accessory, apLoader) {

    let theDevice = self.Platform.device;
    let theOptional = self.services.Switch;
    /////////////////////////////////////////////////////////////

    let theVariable_VID = self.content.Variable_VID;
    let theOn_VID = self.content.On_VID;
    let theOff_VID = self.content.Off_VID;

    let theContainer = self.Platform.Container;
    theContainer.New(theVariable_VID, apLoader);

    theDevice.Events.on('ONLINE',function(data){
        PluginCommand.Command.GetVariable(theDevice, theVariable_VID);
    });

    let l_accessoryInformation = accessory.getService(Api.HAP.Service.AccessoryInformation);

    l_accessoryInformation
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Switch Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01_Sw_T01");

    let l_Switch_On = null;
    /////////////////////////////////////////////////////////////

    let On = {
        // format: Formats.BOOL,
        // perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
    }

    /////////////////////////////////////////////////////////////

    let acc_Switch = accessory.addService(Api.HAP.Service.Switch, self.services.SwitchName)

    l_Switch_On = apLoader.Add(Api.HAP.Categories.SWITCH , 0,
        acc_Switch.getCharacteristic(Api.HAP.Characteristic.On)
            .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {

                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                l_Switch_On.SetValue(value);
                ////////////////////////////////
                let l_val = (value) ? theOn_VID : theOff_VID;
                PluginCommand.Command.Task(theDevice, l_val);
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
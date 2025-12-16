const Api = require('../../../api');
const PluginCommand = require('../../PluginCommand');

exports = module.exports = SetServices;

function SetServices(self, accessory, apLoader) {

    let theDevice = self.Platform.device;
    let theOptional = self.services.Switch;
    /////////////////////////////////////////////////////////////
    let theVID = self.content.VID;

    let theContainer = self.Platform.Container;
    theContainer.New(theVID, apLoader);

    theDevice.Events.on('ONLINE', function (data) {
        PluginCommand.Command.GetLoad(theDevice, theVID);
    });

    //PluginCommand.Command.GetLoad(theDevice, theVID);

    let l_accessoryInformation = accessory.getService(Api.HAP.Service.AccessoryInformation);

    l_accessoryInformation
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Lightbulb Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-Li-T01");

    //let informationService = Api.ServiceFactory.GetDefaultInfoService();
    // let l_Service = null; // 未使用

    let Optional_LIGHTBULB_Brightness = (theOptional.indexOf('Brightness') !== -1) ? true : false;
    let Optional_LIGHTBULB_Saturation = (theOptional.indexOf('Saturation') !== -1) ? true : false;
    let Optional_LIGHTBULB_Hue = (theOptional.indexOf('Hue') !== -1) ? true : false;

    let l_LIGHTBULB_On = null;
    let l_LIGHTBULB_Brightness = null;
    let l_LIGHTBULB_Saturation = null;
    let l_LIGHTBULB_Hue = null;
    /////////////////////////////////////////////////////////////

    let On = {
        // format: Formats.BOOL,
        // perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
    }

    //Optional
    let Brightness = {
        //format: Formats.INT,
        //perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
        //unit: Units.PERCENTAGE,
        //minValue: 0,
        //maxValue: 100,
        //minStep: 1,
    }
    let Saturation = {
        //format: Formats.FLOAT,
        //perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
        //unit: Units.PERCENTAGE,
        //minValue: 0,
        //maxValue: 100,
        //minStep: 1,
    }
    let Hue = {
        //format: Formats.FLOAT,
        //perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
        //unit: Units.ARC_DEGREE,
        //minValue: 0,
        //maxValue: 360,
        //minStep: 1,
    }

    /////////////////////////////////////////////////////////////

    let lightbulb = accessory.addService(Api.HAP.Service.Lightbulb, self.services.SwitchName)

    let timeoutID;

    l_LIGHTBULB_On = apLoader.Add(Api.HAP.Categories.LIGHTBULB, false,
        lightbulb.getCharacteristic(Api.HAP.Characteristic.On)
            .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {

                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                l_LIGHTBULB_On.SetValue(value);
                //////////////////////////////

                clearTimeout(timeoutID);
                timeoutID = setTimeout(() => {
                    if (Optional_LIGHTBULB_Brightness) {
                        let l_open = l_LIGHTBULB_On.GetValue();
                        let l_level = l_LIGHTBULB_Brightness.GetValue();
                        if (l_open == true && l_level == 0) {
                            l_level = 100;
                            l_LIGHTBULB_Brightness.SetValue(l_level);
                        }
                        PluginCommand.Command.LoadLevel(theDevice, theVID, l_open, l_level);
                    } else {
                        let l_open = l_LIGHTBULB_On.GetValue();
                        PluginCommand.Command.Load(theDevice, theVID, l_open);
                    }
                }, 250);

                ////////////////////////////////
                callback();
            })
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {

                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                callback(null, l_LIGHTBULB_On.GetValue());
            }));

    if (Optional_LIGHTBULB_Brightness) {
        l_LIGHTBULB_Brightness = apLoader.Add(Api.HAP.Categories.LIGHTBULB, 0,
            lightbulb.addCharacteristic(Api.HAP.Characteristic.Brightness)
                .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {

                    if (!theDevice.IsConnected()) {
                        callback(theDevice.GetErrorMessage(), null);
                        return;
                    }

                    l_LIGHTBULB_Brightness.SetValue(value);
                    callback();
                })
                .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {

                    if (!theDevice.IsConnected()) {
                        callback(theDevice.GetErrorMessage(), null);
                        return;
                    }

                    callback(null, l_LIGHTBULB_Brightness.GetValue());
                }));
    }
}
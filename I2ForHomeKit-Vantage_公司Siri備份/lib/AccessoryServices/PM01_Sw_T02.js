const Api = require('../../api');
const VantageManager = require('../VantageManager');
const VantageCommand = require('../PluginCommand');

exports = module.exports = SetServices;

function SetServices(currentAccessory, services) {

    //#region 所有資料驗證
    // if (vantageAccessory.content === undefined ||

    //     vantageAccessory.content.Task_VID === undefined) {

    //     // API.logger.warn('[%s] SetServices is error: not found "content".',
    //     //     vantageAccessory.services.SwitchName);
    //     throw new error(vantageAccessory.services.SwitchName + ' SetServices is error: not found "content".');
    // }
    //#endregion 所有資料驗證

    let informationService = services[0];
    let switchService = services[1];

    //設定配件資訊
    informationService
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Switch Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-Sw-T02");

    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;

    currentAccessory.res = {};
    currentAccessory.res.Task_VID = currentAccessory.content.Task_VID;
    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    /**
      * Switch "On"
      */
    let on_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.On); //BOOL {true, false} RWN

    currentAccessory.res.APLoader.AddState("On", on_Characteristic, false);

    /* On Get */
    //if (On_Info.GetEnable) {
    // on_Characteristic.on('get', function (callback) {
    //     callback(null, isOpen);
    // });
    //}

    /* On Set */
    //if (On_Info.SetEnable) {
    on_Characteristic.on('set', function (newValue, callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        callback();

        if (newValue) {
            VantageCommand.Command.Task(
                currentAccessory.res.Task_VID,
                currentAccessory.res.Client,
                currentAccessory.res.APLoader);

            setTimeout(function () {
                // 彈回關閉狀態
                currentAccessory.res.AP2I.UpdateCharacteristic(currentAccessory.res.APLoader,
                    false, "On");
            }, 1000);
        }
    });
}

    // Required Characteristics
    // 上 this.addCharacteristic(Characteristic.On); BOOL {true , false} RWN
    // Optional Characteristics
    // 名稱 this.addOptionalCharacteristic(Characteristic.Name); STRING R
    //let serviceSwitch = new Service.Switch(SwitchName);
    //serviceSwitch.addCharacteristic( Characteristic.Name);
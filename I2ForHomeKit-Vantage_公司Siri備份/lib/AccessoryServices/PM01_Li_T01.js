const Api = require('../../api');
const VantageCommand = require('../PluginCommand');

exports = module.exports = SetServices;


function SetServices(currentAccessory, services) {

    //#region 所有資料驗證
    // if (vantageAccessory.content === undefined ||
    //     vantageAccessory.content.Lightbulb === undefined) {

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
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Lightbulb Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-Li-T01");

    /* 綁定VID配置 */
    //此處決定整個控制的運作
    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;
    let customContainer = {
    }

    let head = currentAccessory.Platform.GenerialManager.New(
        currentAccessory.content.Lightbulb,
        apLoader,
        customContainer);

    currentAccessory.res = {};
    currentAccessory.res.VID = currentAccessory.content.Lightbulb;

    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    let switchConfig = currentAccessory.services.Switch;

    /**
      * Switch "On"
      */
    //let On_Info = switchConfig["On"];

    //if (On_Info) {
    let on_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.On); //BOOL {true, false} RWN

    currentAccessory.res.APLoader.AddState("On", on_Characteristic, false);

    /* On Get */
    //if (On_Info.GetEnable) {
    on_Characteristic.on('get', function (callback) {
        //console.log('Lightblub on_Characteristic Get');

        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        //送出指令
        VantageCommand.Command.GetLoad(
            currentAccessory.res.VID,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);

        setTimeout(function () {
            let isOpen = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "On");
            //let level = VantageManager.GetRemoteState(i2Accessory.Vantage.VID, "Brightness");
            //console.log('callback on state is %s', isOpen);
            callback(null, isOpen);
        }, 300);
    });
    //}

    /* On Set */
    //if (On_Info.SetEnable) {
    on_Characteristic.on('set', function (newValue, callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        // //送出指令
        // VantageCommand.Command.GetLoad(
        //     vantageAccessory.res.VID,
        //     vantageAccessory.res.Client,
        //     vantageAccessory.res.APLoader);

        setTimeout(function () {
            //let remoteLevel = vantageAccessory.res.AP2I.GetRemoteState(vantageAccessory.res.APLoader, "Brightness");
            let localLevel = currentAccessory.res.AP2I.GetLocalState(currentAccessory.res.APLoader, "Brightness");

            //let level = VantageManager.GetRemoteState(i2Accessory.Vantage.VID, "Brightness");
            //console.log('callback on state is %s', isOpen);

            //if localLevel == undefined 表示 Brightness 尚未被啟用
            if (localLevel === undefined || localLevel == 0)
                localLevel = 100;

            if (newValue) {
                VantageCommand.Command.Load(
                    currentAccessory.res.VID,
                    localLevel,
                    currentAccessory.res.Client,
                    currentAccessory.res.APLoader);
            } else {
                VantageCommand.Command.Load(
                    currentAccessory.res.VID,
                    false,
                    currentAccessory.res.Client,
                    currentAccessory.res.APLoader);
            }

            callback();
        }, 100);
    });
    //}
    //}

    /**
     * Switch "Brightness"
     */
    //let Brightness_Info = switchConfig["Brightness"];

    //if (Brightness_Info) {
    if (switchConfig.indexOf('Brightness') >= 0) {
        let Brightness_Characteristic = switchService.addCharacteristic(Api.HAP.Characteristic.Brightness); //INT(PERCENTAGE) {0 ~ 100} RWN

        currentAccessory.res.APLoader.AddState("Brightness", Brightness_Characteristic, 0);

        /* Brightness Get */
        //if (Brightness_Info.GetEnable) {
        Brightness_Characteristic.on('get', function (callback) {
            //console.log('Lightblub Brightness_Characteristic Get');
            //判斷連接  
            if (!currentAccessory.res.Client.IsConnected()) {
                callback(currentAccessory.res.Client.GetErrorMessage(), null);
                return;
            }

            //送出指令
            VantageCommand.Command.GetLoad(
                currentAccessory.res.VID,
                currentAccessory.res.Client,
                currentAccessory.res.APLoader);

            setTimeout(function () {
                let isOpen = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "On");
                let level = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "Brightness");
                if (isOpen)
                    callback(null, level);
                else
                    callback(null, 0);
            }, 300);
        });
        //}
        /* Brightness Set */
        //if (Brightness_Info.SetEnable) {
        Brightness_Characteristic.on('set', function (newValue, callback) {
            //判斷連接  
            if (!currentAccessory.res.Client.IsConnected()) {
                callback(currentAccessory.res.Client.GetErrorMessage(), null);
                return;
            }

            VantageCommand.Command.Load(
                currentAccessory.res.VID,
                newValue,
                currentAccessory.res.Client,
                currentAccessory.res.APLoader);

            //vantageAccessory.res.AP2I.SetLocalState(vantageAccessory.res.APLoader, newValue, "Brightness");

            callback();
        });
    }
    //}
    //}
}
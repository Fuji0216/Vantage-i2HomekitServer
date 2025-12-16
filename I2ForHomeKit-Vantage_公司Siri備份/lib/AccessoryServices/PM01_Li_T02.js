const Api = require('../../api');
const VantageCommand = require('../PluginCommand');

exports = module.exports = SetServices;

function SetServices(currentAccessory, services) {

    //#region 所有資料驗證
    // if (vantageAccessory.content === undefined ||

    //     vantageAccessory.content.Dictionary === undefined ) {

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
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 TASK Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-Li-T02");

    /* 綁定VID配置 */
    //此處決定整個控制的運作
    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;
    let customContainer = {
    }

    // let task = vantageAccessory.Platform.DictionaryManager.New(
    //     vantageAccessory.content.Dictionary,
    //     apLoader,
    //     customContainer);

    currentAccessory.res = {};
    currentAccessory.res.Dictionary = currentAccessory.content.Dictionary;
    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    currentAccessory.res.GetTaskVID = function (key) {
        for (let index = 0; index < this.Dictionary.length; index++) {
            if (this.Dictionary[index].Key == key)
                return this.Dictionary[index].Value;
        }
    }

    //開始設置特性
    let switchConfig = currentAccessory.services.Switch;

    /**
     * Switch "On"
     */
    let on_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.On); //BOOL {true, false} RWN

    on_Characteristic.eventOnlyCharacteristic = true; //使配件禁止操作

    /* On Get */
    on_Characteristic.on('get', function (callback) {
        callback(null);
    });

    /* On Set */
    // on_Characteristic.on('set', function (newValue, callback) {
    //     console.log('Custom On Set');
    //     callback(null, undefined);
    // });

    /**
     * Switch "Brightness"
     */
    let Brightness_Characteristic = switchService.addCharacteristic(Api.HAP.Characteristic.Brightness); //INT(PERCENTAGE) {0 ~ 100} RWN

    Brightness_Characteristic.setProps(
        {
            format: Api.HAP.Characteristic.Formats.INT,
            unit: Api.HAP.Characteristic.Units.PERCENTAGE,
            maxValue: 1000,
            minValue: -1000,
            minStep: 10,
            perms: [Api.HAP.Characteristic.Perms.READ,
            Api.HAP.Characteristic.Perms.WRITE,
            Api.HAP.Characteristic.Perms.NOTIFY]
        }
    );

    /* Brightness Get */
    Brightness_Characteristic.on('get', function (callback) {
        callback(null);
    });
    /* Brightness Set */
    Brightness_Characteristic.on('set', function (newValue, callback) {
        //console.log('Custom Brightness Set = %s', newValue);
        //console.log('Get Task Vid = %s', newValue);
        if (newValue === undefined || newValue <= 100 || newValue > 1000) {
            callback(null, 100);
            return;
        }

        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        let vid = currentAccessory.res.GetTaskVID(newValue);
        //let vid = i2Accessory.Vantage.Task.GetVID(newValue);

        //送出指令
        if (vid !== undefined) {
            //console.log('Call Task Command = %s', vid);
            VantageCommand.Command.Task(
                vid,
                currentAccessory.res.Client,
                currentAccessory.res.APLoader);
        }

        callback(null);
    });
}
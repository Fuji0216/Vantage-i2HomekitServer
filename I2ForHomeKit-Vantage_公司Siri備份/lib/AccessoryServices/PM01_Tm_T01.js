const API = require('../../api');
const VantageManager = require('../VantageManager');
const VantageCommand = require('../PluginCommand');

exports.SetServices = function (currentAccessory, services) {
    Thermostat_Type_Init(currentAccessory, services);
}

function Thermostat_Type_Init(currentAccessory, services) {

    //#region 所有資料驗證
    // if (vantageAccessory.content === undefined ||
    //     vantageAccessory.custom === undefined ||

    //     vantageAccessory.content.Thermostat === undefined ||
    //     vantageAccessory.content.Cool_Set_Point === undefined ||
    //     vantageAccessory.content.Heat_Set_Point === undefined ||
    //     vantageAccessory.content.Indoor_Temperature === undefined) {

    //     // API.logger.warn('[%s] SetServices is error: not found "content" or "custom" Property.',
    //     //     vantageAccessory.services.SwitchName);
    //     throw new error(vantageAccessory.services.SwitchName + ' SetServices is error: not found "content" or "custom" Property.');
    // }

    let maxTemp = currentAccessory.custom.MAX_Temperature;
    if (maxTemp === undefined || maxTemp === "")
        currentAccessory.custom.MAX_Temperature = 38;

    let minTemp = currentAccessory.custom.Min_Temperature;
    if (minTemp === undefined || minTemp === "")
        currentAccessory.custom.Min_Temperature = 10;
    //#endregion 所有資料驗證

    let informationService = services[0];
    let switchService = services[1];

    //設定配件資訊
    informationService
        .setCharacteristic(API.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(API.HAP.Characteristic.Model, "I2 Thermostat Model")
        .setCharacteristic(API.HAP.Characteristic.SerialNumber, "PM01-Tm-T01");

    /* 綁定VID配置 */
    //此處決定整個控制的運作
    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;
    let customContainer = {
    }

    let head = currentAccessory.Platform.VIDHeadManager.NewHead(
        currentAccessory.content,
        apLoader,
        customContainer);
    //console.log('head is %s', head.Nodes);

    currentAccessory.res = {};
    currentAccessory.res.VID = head.GetVID();
    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    //vantageAccessory.res.Variable = {};

    currentAccessory.res.Const = {};
    currentAccessory.res.Const.MAX_Temperature = currentAccessory.custom.MAX_Temperature;
    currentAccessory.res.Const.Min_Temperature = currentAccessory.custom.Min_Temperature;

    //開始設置特性
    let switchConfig = currentAccessory.services.Switch;

    /**
     * Thermostat "CurrentHeatingCoolingState"
     */
    //let CHCS_Info = switchConfig["CurrentHeatingCoolingState"];

    //if (CHCS_Info) {
    let CHCS_Characteristic = switchService.getCharacteristic(API.HAP.Characteristic.CurrentHeatingCoolingState); //UINT8 {0:OFF,1:HEAT,2:COOL} RN

    currentAccessory.res.APLoader.AddState("CurrentHeatingCoolingState", CHCS_Characteristic, 0);

    /* Get */
    //    if (CHCS_Info.GetEnable) {

    CHCS_Characteristic.on('get', function (callback) {

        setTimeout(function () {
            let mode = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "CurrentHeatingCoolingState");
            callback(null, mode);
        }, 300);
    });
    //    }
    //}

    /**
     * Thermostat "TargetHeatingCoolingState"
     */
    //let THCS_Info = switchConfig["TargetHeatingCoolingState"];

    //if (THCS_Info) {
    let THCS_Characteristic = switchService.getCharacteristic(API.HAP.Characteristic.TargetHeatingCoolingState); //UINT8 {0:OFF,1:HEAT,2:COOL,3:AUTO} RWN

    currentAccessory.res.APLoader.AddState("TargetHeatingCoolingState", THCS_Characteristic, 0);

    /* Get */
    //    if (THCS_Info.GetEnable) {
    THCS_Characteristic.on('get', function (callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        //送出指令
        VantageCommand.Command.GETTHERMOP(
            currentAccessory.res.VID,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);

        setTimeout(function () {
            let mode = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "TargetHeatingCoolingState");
            callback(null, mode);
        }, 300);
    });
    //    }
    /* Set */
    //    if (THCS_Info.SetEnable) {
    THCS_Characteristic.on('set', function (newValue, callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        //送出指令
        VantageCommand.Command.THERMOP(
            currentAccessory.res.VID,
            newValue,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);
        callback();
    });
    //    }
    //}

    /**
     * Thermostat "CurrentTemperature"
     */
    //let CT_Info = switchConfig["CurrentTemperature"];

    //if (CT_Info) {
    let CT_Characteristic = switchService.getCharacteristic(API.HAP.Characteristic.CurrentTemperature); //FLOAT(CELSIUS) {0 ~ 100:0.1} RN

    currentAccessory.res.APLoader.AddState("CurrentTemperature", CT_Characteristic);

    /* Get */
    //    if (CT_Info.GetEnable) {
    CT_Characteristic.on('get', function (callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }
        //送出指令

        VantageCommand.Command.GETTHERMTEMP(
            currentAccessory.res.VID,
            2,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);

        setTimeout(function () {
            let mode = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "CurrentTemperature");
            callback(null, mode);
        }, 300);
    });
    //    }
    //}

    /**
     * Thermostat "TargetTemperature" 
     */
    //let TT_Info = switchConfig["TargetTemperature"];

    //if (TT_Info) {
    let TT_Characteristic = switchService.getCharacteristic(API.HAP.Characteristic.TargetTemperature); //FLOAT(CELSIUS) {10 ~ 38:0.1} RWN
    TT_Characteristic.setProps(
        {
            maxValue: new Number(currentAccessory.res.Const.MAX_Temperature),
            minValue: new Number(currentAccessory.res.Const.Min_Temperature)
        });

    currentAccessory.res.APLoader.AddState("TargetTemperature", TT_Characteristic);

    /* Get */
    //if (TT_Info.GetEnable) {
    TT_Characteristic.on('get', function (callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }
        //送出指令
        VantageCommand.Command.GETTHERMTEMP(
            currentAccessory.res.VID,
            0,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);

        setTimeout(function () {
            let mode = currentAccessory.res.AP2I.GetRemoteState(currentAccessory.res.APLoader, "TargetTemperature");
            callback(null, mode);
        }, 300);
    });
    //}
    /* Set */
    //if (TT_Info.SetEnable) {
    TT_Characteristic.on('set', function (newValue, callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        //送出指令
        VantageCommand.Command.THERMTEMP(
            currentAccessory.res.VID,
            newValue,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);
        callback();
    });
    //}
    //}
}

   //Required 
    //當前加熱冷卻狀態 this.addCharacteristic(Characteristic.CurrentHeatingCoolingState); UINT8 {0:OFF,1:HEAT,2:COOL} RN
    //目標加熱冷卻狀態 this.addCharacteristic(Characteristic.TargetHeatingCoolingState); UINT8 {0:OFF,1:HEAT,2:COOL,3:AUTO} RWN
    //當前溫度 this.addCharacteristic(Characteristic.CurrentTemperature); FLOAT(CELSIUS) {0 ~ 100:0.1} RN
    //目標溫度 this.addCharacteristic(Characteristic.TargetTemperature); FLOAT(CELSIUS) {10 ~ 38:0.1} RWN
    //溫度顯示單元 this.addCharacteristic(Characteristic.TemperatureDisplayUnits); UINT8 {0:CELSIUS,1:FAHRENHEIT} RWN
    //Optional 
    //當前相對濕度 this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity); FLOAT(PERCENTAGE) {0 ~ 100} RN
    //目標相對濕度 this.addOptionalCharacteristic(Characteristic.TargetRelativeHumidity); FLOAT(PERCENTAGE) {0 ~ 100} RWN
    //冷卻閾值溫度 this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature); FLOAT(CELSIUS) {10 ~ 35:0.1} RWN
    //加熱閾值溫度 this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature); FLOAT(CELSIUS) {0 ~ 25:0.1} RWN

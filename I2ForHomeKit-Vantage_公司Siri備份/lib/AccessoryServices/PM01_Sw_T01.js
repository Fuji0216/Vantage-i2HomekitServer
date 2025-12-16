const Api = require('../../api');
const VantageManager = require('../VantageManager');
const VantageCommand = require('../PluginCommand');

exports = module.exports = SetServices;

function SetServices(currentAccessory, services) {

    //#region 所有資料驗證
    // if (vantageAccessory.content === undefined ||

    //     vantageAccessory.content.On_VID === undefined ||
    //     vantageAccessory.content.Off_VID === undefined ||
    //     vantageAccessory.content.Variable_VID === undefined ||
    //     vantageAccessory.content.On_Variable === undefined ||
    //     vantageAccessory.content.Off_Variable === undefined) {

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
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-Sw-T01");

    /* 綁定VID配置 */
    //此處決定整個控制的運作
    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;
    let customContainer = {
    }

    let variableProp = currentAccessory.Platform.VariableBoolManager.New(
        currentAccessory.content,
        apLoader,
        customContainer);

    currentAccessory.res = {};
    //vantageAccessory.res.GP = generalProp;
    currentAccessory.res.VariableVID = variableProp.GetValue("Variable_VID");
    currentAccessory.res.On_VID = variableProp.GetValue("On_VID");
    currentAccessory.res.Off_VID = variableProp.GetValue("Off_VID");
    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    let on_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.On); //BOOL {true, false} RWN

    currentAccessory.res.APLoader.AddState("On", on_Characteristic, false);

    /* On Get */
    //if (On_Info.GetEnable) {
    on_Characteristic.on('get', function (callback) {
        //判斷連接  
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        //送出指令
        VantageCommand.Command.GetVariable(
            currentAccessory.res.VariableVID,
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

        VantageCommand.Command.Task(
            (newValue) ? currentAccessory.res.On_VID : currentAccessory.res.Off_VID,
            currentAccessory.res.Client,
            currentAccessory.res.APLoader);

        callback();
    });
}

    // Required Characteristics
    // 上 this.addCharacteristic(Characteristic.On); BOOL {true , false} RWN
    // Optional Characteristics
    // 名稱 this.addOptionalCharacteristic(Characteristic.Name); STRING R
    //let serviceSwitch = new Service.Switch(SwitchName);
    //serviceSwitch.addCharacteristic( Characteristic.Name);
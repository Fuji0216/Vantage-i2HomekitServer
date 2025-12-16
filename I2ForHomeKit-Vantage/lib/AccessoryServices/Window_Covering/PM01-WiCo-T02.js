const Api = require('../../../api');
const PluginCommand = require('../../PluginCommand');

exports = module.exports = SetServices;
function SetServices(self, accessory, apLoader) {
    /*
        目前無雙向 (尚未建立取得狀態資訊的功能)
     */
    let theDevice = self.Platform.device;
    let theOptional = self.services.Switch;
    /////////////////////////////////////////////////////////////

    let theBLIND_VID = self.content.BLIND;

    let l_accessoryInformation = accessory.getService(Api.HAP.Service.AccessoryInformation);

    l_accessoryInformation
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 Switch Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-WiCo-T02");

    let l_WindowCovering_CurrentPosition = null;
    let l_WindowCovering_PositionState = null;
    let l_WindowCovering_TargetPosition = null;
    /////////////////////////////////////////////////////////////

    // let CurrentPosition = {
    //     format: Formats.UINT8,
    //     perms: [Perms.NOTIFY, Perms.PAIRED_READ],
    //     unit: Units.PERCENTAGE,
    //     minValue: 0,
    //     maxValue: 100,
    //     minStep: 1,
    // }
    // let PositionState = {
    //     format: Formats.UINT8,
    //     perms: [Perms.NOTIFY, Perms.PAIRED_READ],
    //     minValue: 0,
    //     maxValue: 2,
    //     minStep: 1,
    //     validValues: [0, 1, 2],
    // }
    // let TargetPosition = {
    //     format: Formats.UINT8,
    //     perms: [Perms.NOTIFY, Perms.PAIRED_READ, Perms.PAIRED_WRITE],
    //     unit: Units.PERCENTAGE,
    //     minValue: 0,
    //     maxValue: 100,
    //     minStep: 1,
    // }

    let threadResource = {};
    threadResource.hasCurrentPromise = false;
    threadResource.hasNextPromise = false;
    threadResource.LockTarget = false;
    threadResource.ExpectValue = undefined;
    threadResource.ExactValue = undefined;
    threadResource.TargetValue = 50;
    /////////////////////////////////////////////////////////////

    let acc_WindowCovering = accessory.addService(Api.HAP.Service.WindowCovering, self.services.SwitchName)

    l_WindowCovering_TargetPosition = apLoader.Add(Api.HAP.Categories.WINDOW_COVERING, 50,
        acc_WindowCovering.getCharacteristic(Api.HAP.Characteristic.TargetPosition)
            .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {
                //console.log('進入');
                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }
                ////////////////////////////////

                let _actionFlag = false;
                //判斷不存在需要執行的Promise
                if (threadResource.hasCurrentPromise == false) {
                    //console.log('初始');
                    //初始化Promise運作條件
                    threadResource.LockTarget = false;
                    threadResource.hasCurrentPromise = true;
                    threadResource.ExpectValue = undefined;
                    threadResource.ExactValue = value;
                    _actionFlag = true;
                }
                //當前存在需要執行的Promise
                else {
                    //判斷當前需要執行的Promise依舊屬於『緩衝準備』狀態
                    if (threadResource.LockTarget == false) {
                        //console.log('覆蓋');
                        //再次指定期望值
                        threadResource.ExpectValue = value;
                    }
                    //判斷當Promise的『緩衝準備』狀態結束
                    else {
                        //需要申請Promise中斷請求，並同時開啟一個新的Promise
                        //console.log('重申');
                        //初始化NextPromise運作條件
                        threadResource.LockTarget = false;
                        threadResource.hasNextPromise = true;

                        threadResource.ExpectValue = undefined;
                        threadResource.ExactValue = value;
                        _actionFlag = true;
                    }
                }

                if (_actionFlag) {
                    let promise = new Promise(function (resolve, reject) {
                        //console.log("Promise");
                        let timeoutID = setInterval(function () {
                            //期望 與 確切值 的 『緩衝準備』
                            if (threadResource.ExpectValue !== undefined &&  //表示有新目標
                                threadResource.ExpectValue != threadResource.ExactValue) {
                                threadResource.ExactValue = threadResource.ExpectValue;
                                threadResource.ExpectValue = undefined;
                                //console.log('取值');
                            }
                            //判斷當上一個需要執行的Promise已經結束
                            else if (threadResource.hasNextPromise == false) {
                                //console.log('鎖定');
                                threadResource.LockTarget = true; //緩衝旗號 鎖定

                                threadResource.TargetValue = threadResource.ExactValue;
                                //console.log(threadResource.TargetValue);
                                clearInterval(timeoutID);
                                return resolve();
                            }
                        }, 1000);
                    }).then(success => {
                        //console.log('完成');
                        //l_WindowCovering_TargetPosition.GetValue();

                        l_WindowCovering_TargetPosition.SetValue(threadResource.TargetValue);

                        let targetValue = threadResource.TargetValue;
                        if (targetValue == 100 || targetValue == 0) {
                            PluginCommand.Command.BLIND(theDevice, theBLIND_VID,
                                (targetValue == 100) ? "OPEN" : (targetValue == 0) ? "CLOSE" : "STOP");
                        }
                        else {
                            PluginCommand.Command.BLINDPOS(theDevice, theBLIND_VID, targetValue);
                        }

                        //l_WindowCovering_TargetPosition.UpdateCharacteristic(threadResource.TargetValue);
                        l_WindowCovering_CurrentPosition.UpdateCharacteristic(targetValue);

                    }).catch(fail => {
                        //console.log(fail);

                    }).finally(function () {
                        //console.log('結束');
                        threadResource.hasCurrentPromise = threadResource.hasNextPromise;
                        threadResource.hasNextPromise = false;
                    });;
                }

                //let l_val = (value) ? theOnNumber : theOffNumber;
                //PluginCommand.Command.SetRoutine(theDevice, theName, l_val);
                ////////////////////////////////
                callback();
            })
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {
                callback(null, l_WindowCovering_TargetPosition.GetValue());
            }));

    l_WindowCovering_CurrentPosition = apLoader.Add(Api.HAP.Categories.WINDOW_COVERING, 50,
        acc_WindowCovering.getCharacteristic(Api.HAP.Characteristic.CurrentPosition)
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {
                ////////////////////////////////
                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                callback(null, l_WindowCovering_TargetPosition.GetValue());
                ////////////////////////////////
            }));


}
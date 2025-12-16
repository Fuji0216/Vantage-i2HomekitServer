const Api = require('../../api');
const VantageCommand = require('../PluginCommand');

exports = module.exports = SetServices;

function SetServices(currentAccessory, services) {
    // if (pluginAccessory.content === undefined ||
    //     pluginAccessory.custom === undefined ||

    //     pluginAccessory.content.OPEN === undefined ||
    //     pluginAccessory.content.CLOSE === undefined ||
    //     pluginAccessory.content.STOP === undefined) {

    //     throw new error(pluginAccessory.services.SwitchName + ' SetServices is error: not found "content" or "custom" Property.');
    // }

    let informationService = services[0];
    let switchService = services[1];
    let switchConfig = currentAccessory.services.Switch;

    //設定配件資訊
    informationService
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "I2 WindowCovering Model")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-WiCo-T01");

    /* 綁定VID配置 */
    //此處決定整個控制的運作
    let apLoader = currentAccessory.APLoader;
    let device = currentAccessory.Platform.device;
    let customContainer = {
    }

    currentAccessory.res = {};
    currentAccessory.res.Client = device;
    currentAccessory.res.APLoader = apLoader;
    currentAccessory.res.AP2I = apLoader.AdvancedAPI;

    currentAccessory.res.Config = {}; //所有配件所需配置參數

    currentAccessory.res.Config.VID = {}; //所有配件所需配置參數

    currentAccessory.res.Config.VID.OPEN = currentAccessory.content.OPEN;
    currentAccessory.res.Config.VID.CLOSE = currentAccessory.content.CLOSE;
    currentAccessory.res.Config.VID.STOP = currentAccessory.content.STOP;

    currentAccessory.res.Config.ActionTime = currentAccessory.custom.ActionTime;
    currentAccessory.res.Config.Min_ActionTime = currentAccessory.custom.Min_ActionTime;
    currentAccessory.res.Config.ActionDelay = currentAccessory.custom.ActionDelay;

    currentAccessory.res.Const = {}; //固定常數數值
    currentAccessory.res.Const.InitValue = 50;
    currentAccessory.res.Const.IntervalValue =
        Math.ceil((100 / currentAccessory.res.Config.ActionTime) * currentAccessory.res.Config.Min_ActionTime);

    currentAccessory.res.Variable = {}; //邏輯、狀態運作變量
    currentAccessory.res.Variable.currentValue = currentAccessory.res.Const.InitValue; //當前、累加數值
    currentAccessory.res.Variable.targetValue = currentAccessory.res.Const.InitValue; //目標數值
    currentAccessory.res.Variable.safetyValue = currentAccessory.res.Const.InitValue; //動作安全數值 
    currentAccessory.res.Variable.dirOffset = 0; //方向 [-1 or 1]
    currentAccessory.res.Variable.dirTag = ""; //方向標籤 [STOP , OPEN , CLOSE]

    currentAccessory.res.Variable.hasCurrentPromise = false; //當前是否存在需要執行的Promise
    currentAccessory.res.Variable.hasNextPromise = false; //是否存在下一個需要執行的Promise

    currentAccessory.res.Variable.ExpectValue = undefined; //期望值
    currentAccessory.res.Variable.ExactValue = undefined; //確切值
    currentAccessory.res.Variable.LockTarget = false; //目標值鎖定

    /***********************************
     * WindowCovering "CurrentPosition"
     ***********************************/
    let CP_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.CurrentPosition); // UINT8(PERCENTAGE) {0~100} RN 
    currentAccessory.res.APLoader.AddState("CurrentPosition", CP_Characteristic);
    /* CurrentPosition Get */
    CP_Characteristic.on('get', function (callback) {
        let level = currentAccessory.res.AP2I.GetLocalState(currentAccessory.res.APLoader, "CurrentPosition");
        if (level === undefined) level = currentAccessory.res.Const.InitValue;
        callback(null, level);
    });

    /***********************************
     * WindowCovering "TargetPosition"
     ***********************************/
    let TP_Characteristic = switchService.getCharacteristic(Api.HAP.Characteristic.TargetPosition); // UINT8(PERCENTAGE) {0~100} RWN
    currentAccessory.res.APLoader.AddState("TargetPosition", TP_Characteristic);
    /* TargetPosition Get */
    TP_Characteristic.on('get', function (callback) {
        let level = currentAccessory.res.AP2I.GetLocalState(currentAccessory.res.APLoader, "TargetPosition");
        if (level === undefined) level = currentAccessory.res.Const.InitValue;
        callback(null, level);
    });
    /* TargetPosition Set */
    TP_Characteristic.on('set', function (newValue, callback) {
        // 判斷裝置是否連線
        if (!currentAccessory.res.Client.IsConnected()) {
            callback(currentAccessory.res.Client.GetErrorMessage(), null);
            return;
        }

        let _actionFlag = false;

        if (currentAccessory.res.Variable.targetValue == newValue) {
            if (newValue != 100 && newValue != 0) {
                callback();
                return;
            }
        }

        //判斷不存在需要執行的Promise
        if (currentAccessory.res.Variable.hasCurrentPromise == false) {
            //初始化Promise運作條件
            currentAccessory.res.Variable.LockTarget = false;
            currentAccessory.res.Variable.hasCurrentPromise = true;
            currentAccessory.res.Variable.ExpectValue = undefined;
            currentAccessory.res.Variable.ExactValue = newValue;
            _actionFlag = true;
        }
        //當前存在需要執行的Promise
        else {
            //判斷當前需要執行的Promise依舊屬於『緩衝準備』狀態
            if (currentAccessory.res.Variable.LockTarget == false) {
                //再次指定期望值
                currentAccessory.res.Variable.ExpectValue = newValue;
            }
            //判斷當Promise的『緩衝準備』狀態結束
            else {
                //需要申請Promise中斷請求，並同時開啟一個新的Promise

                //初始化NextPromise運作條件
                currentAccessory.res.Variable.LockTarget = false;
                currentAccessory.res.Variable.hasNextPromise = true;

                currentAccessory.res.Variable.ExpectValue = undefined;
                currentAccessory.res.Variable.ExactValue = newValue;
                _actionFlag = true;
            }
        }

        if (_actionFlag) {
            let promise = new Promise(function (resolve, reject) {
                //準備期
                let timeoutID = setInterval(function () {
                    //期望 與 確切值 的 『緩衝準備』
                    if (currentAccessory.res.Variable.ExpectValue !== undefined &&  //表示有新目標
                        currentAccessory.res.Variable.ExpectValue != currentAccessory.res.Variable.ExactValue) {
                        currentAccessory.res.Variable.ExactValue = currentAccessory.res.Variable.ExpectValue;
                        currentAccessory.res.Variable.ExpectValue = undefined;
                    }
                    //判斷當上一個需要執行的Promise已經結束
                    else if (currentAccessory.res.Variable.hasNextPromise == false) {
                        currentAccessory.res.Variable.LockTarget = true; //緩衝旗號 鎖定

                        let _lockTarget = currentAccessory.res.Variable.ExactValue;

                        //判斷連續兩次設定最高或最低,則強制運行50%,用於歸位
                        currentAccessory.res.Variable.targetValue =
                            (currentAccessory.res.Variable.lastTargetValue == 100 && _lockTarget == 100) ? 150 :
                                (currentAccessory.res.Variable.lastTargetValue == 0 && _lockTarget == 0) ? -50 : _lockTarget;

                        // 用於紀錄上一次動作的數值
                        currentAccessory.res.Variable.lastTargetValue = _lockTarget;

                        clearInterval(timeoutID);
                        return resolve();
                    }
                }, 1000);
            }).then(function () {
                //運行期
                //計算方向、指令標籤
                if (currentAccessory.res.Variable.currentValue > currentAccessory.res.Variable.targetValue) {
                    currentAccessory.res.Variable.dirOffset = -1;
                    currentAccessory.res.Variable.dirTag = "CLOSE";
                }
                else if (currentAccessory.res.Variable.currentValue < currentAccessory.res.Variable.targetValue) {
                    currentAccessory.res.Variable.dirOffset = +1;
                    currentAccessory.res.Variable.dirTag = "OPEN";
                }
                else {
                    return Promise.reject();
                }

                //計算安全值
                currentAccessory.res.Variable.safetyValue =
                    currentAccessory.res.Variable.currentValue +
                    (currentAccessory.res.Const.IntervalValue * currentAccessory.res.Variable.dirOffset);

                let vid = currentAccessory.res.Config.VID[currentAccessory.res.Variable.dirTag];

                VantageCommand.Command.Task(
                    vid,
                    currentAccessory.res.Client,
                    currentAccessory.res.APLoader);
                //console.time();
                return new Promise((resolve, reject) => {
                    let timeoutID = new AdjustingInterval(
                        function () {
                            currentAccessory.res.Variable.currentValue += currentAccessory.res.Variable.dirOffset;
                            //console.log('now value = %s', pluginAccessory.res.Variable.currentValue);

                            //判斷安全範圍,至少要到達值
                            if (currentAccessory.res.Variable.dirTag == "OPEN") {
                                let temp = (currentAccessory.res.Variable.safetyValue >= currentAccessory.res.Variable.targetValue) ?
                                    currentAccessory.res.Variable.safetyValue : currentAccessory.res.Variable.targetValue;

                                //檢查是否到達目標
                                if (currentAccessory.res.Variable.currentValue == temp) {
                                    timeoutID.stop();//clearInterval(timeoutID);
                                    return resolve("OK");
                                }

                                //檢查是否被中斷 等待達成安全範圍
                                if (currentAccessory.res.Variable.hasNextPromise &&
                                    currentAccessory.res.Variable.currentValue >= currentAccessory.res.Variable.safetyValue) {
                                    timeoutID.stop();//clearInterval(timeoutID);
                                    return resolve("OK");
                                }
                            } else if (currentAccessory.res.Variable.dirTag == "CLOSE") {
                                let temp = (currentAccessory.res.Variable.safetyValue <= currentAccessory.res.Variable.targetValue) ?
                                    currentAccessory.res.Variable.safetyValue : currentAccessory.res.Variable.targetValue;

                                //檢查是否到達目標
                                if (currentAccessory.res.Variable.currentValue == temp) {
                                    timeoutID.stop();//clearInterval(timeoutID);
                                    return resolve("OK");
                                }

                                //檢查是否被中斷 等待達成安全範圍
                                if (currentAccessory.res.Variable.hasNextPromise &&
                                    currentAccessory.res.Variable.currentValue <= currentAccessory.res.Variable.safetyValue) {
                                    timeoutID.stop();//clearInterval(timeoutID);
                                    return resolve("OK");
                                }
                            }
                        }, currentAccessory.res.Config.ActionTime / 100,
                        parseInt(currentAccessory.res.Config.ActionDelay));
                    timeoutID.start();
                });

            }).then(function () {
                //停止期
                let vid = currentAccessory.res.Config.VID["STOP"];
                VantageCommand.Command.Task(
                    vid,
                    currentAccessory.res.Client,
                    currentAccessory.res.APLoader);
                //console.timeEnd();
                return new Promise((resolve, reject) => {
                    setTimeout(function () { resolve("OK"); }, currentAccessory.res.Config.Min_ActionTime);
                });

            }).catch(function () {
                //錯誤
            }).finally(function () {
                //通知 & 狀態更新期

                //重新設定目前的實際變量有效值
                if (currentAccessory.res.Variable.currentValue > 100)
                    currentAccessory.res.Variable.currentValue = 100;
                else if (currentAccessory.res.Variable.currentValue < 0)
                    currentAccessory.res.Variable.currentValue = 0;

                //同步當前狀態
                currentAccessory.res.Variable.targetValue = currentAccessory.res.Variable.currentValue;

                //更新當前的變量
                currentAccessory.res.AP2I.UpdateCharacteristic(currentAccessory.res.APLoader, currentAccessory.res.Variable.currentValue, "CurrentPosition");

                currentAccessory.res.Variable.hasCurrentPromise = currentAccessory.res.Variable.hasNextPromise;
                currentAccessory.res.Variable.hasNextPromise = false;

                //當沒有任何動作需求後,更新目標的變量
                if (!currentAccessory.res.Variable.hasNextPromise && !currentAccessory.res.Variable.hasCurrentPromise)
                    currentAccessory.res.AP2I.UpdateCharacteristic(currentAccessory.res.APLoader, currentAccessory.res.Variable.currentValue, "TargetPosition");

            });
        }

        currentAccessory.res.AP2I.SetLocalState(currentAccessory.res.APLoader, newValue, "TargetPosition");
        callback();
    });
}

function AdjustingInterval(workFunc, interval, actionDelay, errorFunc) {
    var that = this;
    var expected, timeout;
    var stopFlag = false;
    this.interval = interval;
    this.actionDelay = actionDelay;

    this.start = function () {
        this.startTime;

        expected = Date.now() + this.interval + this.actionDelay;
        timeout = setTimeout(dirOffset, this.interval + this.actionDelay);
    }

    this.stop = function () {
        clearTimeout(timeout);
        stopFlag = true;
    }

    function dirOffset() {
        if (stopFlag) return;

        var drift = Date.now() - expected;
        if (drift > that.interval) {
            // You could have some default stuff here too...
            if (errorFunc) errorFunc();
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(dirOffset, Math.max(0, that.interval - drift));
    }
}

    // Required Characteristics
    // 當前位置 this.addCharacteristic(Characteristic.CurrentPosition); UINT8(PERCENTAGE) {0~100} RN 
    // 位置狀態 this.addCharacteristic(Characteristic.PositionState); UINT8 {0:DECREASING ,1:INCREASING ,2:STOPPED } RN
    // 目標位置 this.addCharacteristic(Characteristic.TargetPosition); UINT8(PERCENTAGE) {0~100} RWN
    // Optional Characteristics
    // 保持位置 this.addOptionalCharacteristic(Characteristic.HoldPosition); BOOL {true, false} W
    // 目標水平傾斜角 this.addOptionalCharacteristic(Characteristic.TargetHorizontalTiltAngle); INT(ARC_DEGREE) {90~-90} RWN
    // 目標垂直傾斜角 this.addOptionalCharacteristic(Characteristic.TargetVerticalTiltAngle); INT(ARC_DEGREE) {90~-90} RWN
    // 當前水平傾斜角 this.addOptionalCharacteristic(Characteristic.CurrentHorizontalTiltAngle); INT(ARC_DEGREE) {90~-90} RN
    // 當前垂直傾斜角 this.addOptionalCharacteristic(Characteristic.CurrentVerticalTiltAngle); INT(ARC_DEGREE) {90~-90} RN
    // 檢測到障礙物 this.addOptionalCharacteristic(Characteristic.ObstructionDetected); BOOL {true,false} RN
    // 名稱 this.addOptionalCharacteristic(Characteristic.Name); STRING R
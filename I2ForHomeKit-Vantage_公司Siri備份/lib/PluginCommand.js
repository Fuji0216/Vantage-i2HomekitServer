
const API = require('../api');
/* 開放資源 與 VantageManager 合作，因為各配件屬性不相同 */
/* 此處用來定義整個Vantage控制規則 */

exports.Analyze = function (data) {
    let platform = this;
    let part = data.toString().split(/\r\n/g);

    for (let index = 0; index < part.length - 1; index++) {
        let resArray = part[index].toUpperCase().split(/[:| ]/g);

        API.logger.info('Analyze data = ' + resArray);

        //console.log('Analyze data = ' +resArray );

        let mode = resArray[0]; // if S 由別人指定 , R 由自身
        let cmd = resArray[1];
        //let isFromLocal = (mode == 'R') ? true : false; //R表示自身設定,S表示別人設定 ,當從遠端則不可覆蓋屬性
        let isFromLocal = (mode == 'R') ? true : false; //R表示自身設定,S表示別人設定 ,當從遠端則不可覆蓋屬性

        //let vid = resArray[2]; //依據模式&指令決定參數定義
        //let level = resArray[3]; //依據模式&指令決定參數定義
        //console.log('---' + mode + '---' + resArray[2] + '---');
        switch (cmd) {
            case "GETBLIND":
            case "BLIND":
                {
                    //R:BLIND 4888 POS 90.000[cr] 5
                    //R:BLIND 4888 OPEN[cr] X 4
                    //R:GETBLIND 4888 100.000[cr] 4

                    //S:BLIND 4920 66.667[cr] 4

                    let vid = resArray[2];
                    let level = resArray[resArray.length - 1];

                    if (!level.match(/^[0-9]{1,3}.000$/g)) {
                        let type = Enum_THERMTEMP_Type.indexOf(level);
                        if (type == 1 || type == 2) {
                            level = (type == 1) ? 100 : 0;
                        }
                        else break;
                    }

                    let apLoader = platform.GenerialManager.GetAPLoader(vid);
                    if (apLoader === undefined) return;

                    //兩個同時??
                    apLoader.AdvancedAPI.SetRemoteState(apLoader, level, "TargetPosition", isFromLocal);
                    apLoader.AdvancedAPI.SetRemoteState(apLoader, level, "CurrentPosition", isFromLocal);
                    //apLoader.AdvancedAPI.UpdateCharacteristic(apLoader, level, "CurrentPosition", isFromLocal);
                }
                break;
            /* 燈光 */
            case "GETLOAD": //設定燈光亮度&開關
            case "LOAD": //resArray[2]:VID,resArray[3]:燈光值
                {
                    let vid = resArray[2];
                    let apLoader = platform.GenerialManager.GetAPLoader(vid);
                    if (apLoader === undefined) return;

                    let value = parseInt(resArray[3]);
                    let isOpen = (value) ? true : false;
                    if (isOpen)
                        apLoader.AdvancedAPI.SetRemoteState(apLoader, value, "Brightness", isFromLocal);
                    apLoader.AdvancedAPI.SetRemoteState(apLoader, isOpen, "On", isFromLocal);

                    // if (value > 0 && value <= 100) {
                    //     apLoader.AdvancedAPI.SetRemoteState(apLoader, true, "On"); // vid , level
                    //     apLoader.AdvancedAPI.SetRemoteState(apLoader, value, "Brightness"); // vid , level
                    // }
                    // else if (value == 0) {
                    //     apLoader.AdvancedAPI.SetRemoteState(apLoader, false, "On"); // vid , level
                    //     apLoader.AdvancedAPI.SetRemoteState(apLoader, value, "Brightness"); // vid , level
                    // }
                    // else
                    //     throw new Error('VantageCommand "Analyze" Load "Brightness Value" is "undefine".');
                }
                break;
            case "GETTHERMOP": //空調模式
            case "THERMOP": //resArray[2]:VID,resArray[3]:冷氣模式
                {
                    let vid = resArray[2];
                    let apLoader = platform.VIDHeadManager.GetAPLoader(vid);
                    if (apLoader === undefined) return;

                    let value = Enum_THERMOP_Type.indexOf(resArray[3]);
                    apLoader.AdvancedAPI.SetRemoteState(apLoader, value,
                        "TargetHeatingCoolingState", isFromLocal); // 目標加熱冷卻狀態 vid , level

                    apLoader.AdvancedAPI.SetRemoteState(apLoader,
                        (value >= 3) ? 0 : value,
                        "CurrentHeatingCoolingState", false); // 當前加熱冷卻狀態 vid , level
                }
                break;
            case "GETTHERMTEMP": //空調溫度
            case "THERMTEMP": //resArray[2]:VID,resArray[3]:冷氣模式,resArray[4]:冷氣溫度
                {
                    let vid = resArray[2];
                    let apLoader = platform.VIDHeadManager.GetAPLoader(vid);
                    if (apLoader === undefined) return;

                    if (resArray[4] <= 0) break;
                    let value = Enum_THERMTEMP_Type.indexOf(resArray[3]);
                    if (value == 2) //表示室內溫度
                        apLoader.AdvancedAPI.SetRemoteState(apLoader, resArray[4],
                            "CurrentTemperature", isFromLocal); //當前溫度 vid , level
                    else
                        apLoader.AdvancedAPI.SetRemoteState(apLoader, resArray[4],
                            "TargetTemperature", isFromLocal); //目標溫度 vid , level
                }
                break;
            case "TEMP": //空調溫度
                {
                    let vid = resArray[2];
                    let apLoader = platform.VIDHeadManager.GetAPLoader(vid);

                    let Tab = platform.VIDHeadManager.GetTabByVID(vid);
                    let MasterVID = platform.VIDHeadManager.GetVIDByTag(vid, 'Thermostat');
                    //console.log('Tab is %s VID is %s', Tab, MasterVID);
                    //resArray[2]:Child VID,resArray[3]:冷氣溫度
                    //let TEMP_Tab = VantageManager.GetCurrentNodeTab(resArray[2]);//ex:TEMP 4719 & 4720, but MasterVID is 4718
                    //let TEMP_MasterVID = VantageManager.GetTargetNodeVID(resArray[2], 'Thermostat');
                    if (!Tab || MasterVID === undefined) break;

                    let TEMP_value_Mode = Enum_THERMTEMP_Type.indexOf(Tab);
                    if (TEMP_value_Mode == 2) //表示室內溫度
                        apLoader.AdvancedAPI.SetRemoteState(apLoader, resArray[3],
                            "CurrentTemperature", isFromLocal); // 當前溫度 vid , level
                    else
                        apLoader.AdvancedAPI.SetRemoteState(apLoader, resArray[3],
                            "TargetTemperature", isFromLocal); // 目標溫度 vid , level
                }
                break;
            case "TASK":
                break;
            case "GETVARIABLE":
            case "VARIABLE":
                let vid = resArray[2];
                let value = resArray[3];
                let apLoader = platform.VariableBoolManager.GetAPLoader(vid);
                if (apLoader === undefined) return;
                let state = platform.VariableBoolManager.GetResultBool(vid, value);
                apLoader.AdvancedAPI.SetRemoteState(apLoader, state, "On", isFromLocal);
                break;
            default:
                //console.log('Cmd is not Define');
                break;
        }
    }
}

exports.Command =
{
    GetLoad: function (vid, device, apLoader) {
        API.logger.info('Send Commnad = GetLoad ' + vid);
        device.Write('GetLoad ' + vid + '\r');
    },
    Load: function (vid, level, device, apLoader) {
        //console.log('LOAD ' + vid + ' ' + level + '\r');
        if (typeof level === "boolean") {  //當Value;
            apLoader.AdvancedAPI.SetLocalState(apLoader, level, "On"); // vid , level
            if (level) {
                API.logger.info('Send Commnad = LOAD ' + vid + ' ' + 100);
                device.Write('LOAD ' + vid + ' ' + 100 + '\r');
                //throw new Error('VantageCommand "Command" Load "On Value" is "True".');
            } else {
                API.logger.info('Send Commnad = LOAD ' + vid + ' ' + 0 + '\r');
                device.Write('LOAD ' + vid + ' ' + 0 + '\r');
            }
        }
        else {
            if (level > 0 && level <= 100) {
                apLoader.AdvancedAPI.SetLocalState(apLoader, true, "On"); // vid , level
                apLoader.AdvancedAPI.SetLocalState(apLoader, level, "Brightness"); // vid , level
                API.logger.info('Send Commnad = LOAD ' + vid + ' ' + level);
                device.Write('LOAD ' + vid + ' ' + level + '\r');
            }
            else if (level == 0) {
                apLoader.AdvancedAPI.SetLocalState(apLoader, false, "On"); // vid , level
                apLoader.AdvancedAPI.SetLocalState(apLoader, level, "Brightness"); // vid , level
                API.logger.info('Send Commnad = LOAD ' + vid + ' ' + level);
                device.Write('LOAD ' + vid + ' ' + level + '\r');
            }
            else
                throw new Error('VantageCommand "Command" Load "Brightness Value" is "undefine".');
        }
    },
    RAMPLOAD : function (vid, level, device, apLoader) {
        //console.log('LOAD ' + vid + ' ' + level + '\r');
        if (typeof level === "boolean") {  //當Value;
            apLoader.AdvancedAPI.SetLocalState(apLoader, level, "On"); // vid , level
            if (level) {
                API.logger.info('Send Commnad = RAMPLOAD ' + vid + ' ' + 100);
                device.Write('RAMPLOAD ' + vid + ' ' + 100 + ' 0\r');
                //throw new Error('VantageCommand "Command" Load "On Value" is "True".');
            } else {
                API.logger.info('Send Commnad = RAMPLOAD ' + vid + ' ' + 0 + '\r');
                device.Write('RAMPLOAD ' + vid + ' ' + 0 + ' 0\r');
            }
        }
        else {
            if (level > 0 && level <= 100) {
                apLoader.AdvancedAPI.SetLocalState(apLoader, true, "On"); // vid , level
                apLoader.AdvancedAPI.SetLocalState(apLoader, level, "Brightness"); // vid , level
                API.logger.info('Send Commnad = RAMPLOAD ' + vid + ' ' + level);
                device.Write('RAMPLOAD ' + vid + ' ' + level + ' 0\r');
            }
            else if (level == 0) {
                apLoader.AdvancedAPI.SetLocalState(apLoader, false, "On"); // vid , level
                apLoader.AdvancedAPI.SetLocalState(apLoader, level, "Brightness"); // vid , level
                API.logger.info('Send Commnad = RAMPLOAD ' + vid + ' ' + level);
                device.Write('RAMPLOAD ' + vid + ' ' + level + ' 0\r');
            }
            else
                throw new Error('VantageCommand "Command" RAMPLOAD "Brightness Value" is "undefine".');
        }
    },
    /* 冷氣 */
    THERMOP: function (vid, mode, device, apLoader) {
        let val = Enum_THERMOP_Type[mode];
        apLoader.AdvancedAPI.SetLocalState(apLoader, mode, "TargetHeatingCoolingState"); //目標加熱冷卻狀態
        //API.logger.info('Send Commnad = THERMOP ' + vid + ' ' + val);
        device.Write('THERMOP ' + vid + ' ' + val + '\r');
    },
    GETTHERMOP: function (vid, device, apLoader) {
        //API.logger.info('Send Commnad = GETTHERMOP ' + vid + '\r');
        device.Write('GETTHERMOP ' + vid + '\r');
    },
    THERMTEMP: function (vid, level, device, apLoader) {
        apLoader.AdvancedAPI.SetLocalState(apLoader, level, "TargetTemperature"); //目標溫度
        //API.logger.info('Send Commnad = THERMTEMP ' + vid + ' COOL ' + level);
        device.Write('THERMTEMP ' + vid + ' COOL ' + level + '\r');
    },
    GETTHERMTEMP: function (vid, mode, device, apLoader) {
        let val = Enum_THERMTEMP_Type[mode];
        //API.logger.info('Send Commnad = GETTHERMTEMP ' + vid + ' ' + val);
        device.Write('GETTHERMTEMP ' + vid + ' ' + val + '\r');
    },
    Task: function (vid, device, apLoader) {
        //API.logger.info('Send Commnad = TASK ' + vid + ' press\r');
        device.Write('TASK ' + vid + ' press\r');
    },
    GetVariable: function (vid, device, apLoader) {
        //API.logger.info('Send Commnad = GetVariable ' + vid);
        device.Write('GetVariable ' + vid + '\r');
    },
    BLIND: function (vid, type, device, apLoader) {
        let val = Enum_BLIND_Type[type];
        if (type == 1 || type == 2) { //目前TargetPosition不支援停止
            let level = (type == 1) ? 100 : 0;
            apLoader.AdvancedAPI.SetLocalState(apLoader, level, "TargetPosition"); 
        }
        device.Write('BLIND ' + vid + " " + val + '\r');
    },
    BLINDPOS: function (vid, level, device, apLoader) {
        apLoader.AdvancedAPI.SetLocalState(apLoader, level, "TargetPosition"); 
        device.Write('BLIND ' + vid + " POS " + level + '\r');
    },
    GETBLIND: function (vid, device, apLoader) {
        device.Write('GETBLIND ' + vid + '\r');
    }
}

var Enum_THERMOP_Type = ["OFF", "HEAT", "COOL", "AUTO"];
var Enum_THERMTEMP_Type = ["COOL", "HEAT", "INDOOR"];
var Enum_BLIND_Type = ["STOP", "OPEN", "CLOSE"];
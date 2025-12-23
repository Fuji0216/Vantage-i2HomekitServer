const Api = require('../../../api');
const PluginCommand = require('../../PluginCommand');

exports = module.exports = SetServices;

function SetServices(self, accessory, apLoader) {

    let theDevice = self.Platform.device;
    
    // 讀取 Task 模式的三個 VID
    let vidOpen = self.content.OPEN;
    let vidClose = self.content.CLOSE;
    let vidStop = self.content.STOP;

    // 建立唯一的 UID (使用 OPEN VID 作為代表)
    let theUID = "WC_Task_" + vidOpen;

    let l_accessoryInformation = accessory.getService(Api.HAP.Service.AccessoryInformation);

    l_accessoryInformation
        .setCharacteristic(Api.HAP.Characteristic.Manufacturer, "INNOVATED INTERGRATION")
        .setCharacteristic(Api.HAP.Characteristic.Model, "Vantage Blind Task")
        .setCharacteristic(Api.HAP.Characteristic.SerialNumber, "PM01-WiCo-Task");

    // [修正] 使用 getService 優先，避免重啟時發生 Service already exists 錯誤
    let wcService = accessory.getService(Api.HAP.Service.WindowCovering) || accessory.addService(Api.HAP.Service.WindowCovering, self.services.SwitchName);

    // 用於防抖的 Timer
    let debounceTimer = null;
    let currentPos = 50; // 預設中間位置

    // 1. Target Position (目標位置)
    let l_TargetPosition = apLoader.Add(Api.HAP.Categories.WINDOW_COVERING, 50,
        wcService.getCharacteristic(Api.HAP.Characteristic.TargetPosition)
            .on(Api.HAP.CharacteristicEventTypes.SET, (value, callback) => {
                
                if (!theDevice.IsConnected()) {
                    callback(theDevice.GetErrorMessage(), null);
                    return;
                }

                // 清除舊的 Timer (防抖機制，避免滑動過程連續觸發)
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                // 設定新的 Timer，延遲 500ms 執行
                debounceTimer = setTimeout(() => {
                    
                    // 根據需求判斷數值範圍
                    if (value === 0) {
                        // CLOSE 動作 (VID = OPEN)
                        // 修改: 0 為 OPEN (通常 HomeKit 100% 是開)
                        Api.logger.info(`[Window Task] Trigger OPEN (VID: ${vidOpen})`);
                        PluginCommand.Command.Task(theDevice, vidOpen);
                        currentPos = 0;
                    } 
                    else if (value > 99) {
                        // OPEN 動作 (VID = CLOSE)
                        // 修改: >99 為 CLOSE
                        Api.logger.info(`[Window Task] Trigger CLOSE (VID: ${vidClose})`);
                        PluginCommand.Command.Task(theDevice, vidClose);
                        currentPos = 100;
                    } 
                    else if (value >= 20 && value <= 80) {
                        // STOP 動作 (VID = STOP)
                        // 修改: 20~80 為 STOP
                        Api.logger.info(`[Window Task] Trigger STOP (VID: ${vidStop})`);
                        PluginCommand.Command.Task(theDevice, vidStop);
                        currentPos = value; // 停在當前位置
                    } 
                    else {
                        // 其他範圍 (如 1-19, 81-98)
                        // 根據需求，這裡暫時不觸發任何動作
                        currentPos = value;
                    }

                    // 更新 CurrentPosition 讓 HomeKit 知道動作已完成 (停止轉圈)
                    wcService.getCharacteristic(Api.HAP.Characteristic.CurrentPosition).updateValue(currentPos);
                    wcService.getCharacteristic(Api.HAP.Characteristic.PositionState).updateValue(Api.HAP.Characteristic.PositionState.STOPPED);

                }, 500); 

                callback();
            })
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {
                callback(null, currentPos);
            }));

    // 2. Current Position (當前位置)
    let l_CurrentPosition = apLoader.Add(Api.HAP.Categories.WINDOW_COVERING, 50,
        wcService.getCharacteristic(Api.HAP.Characteristic.CurrentPosition)
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {
                callback(null, currentPos);
            }));

    // 3. Position State (狀態)
    let l_PositionState = apLoader.Add(Api.HAP.Categories.WINDOW_COVERING, 2,
        wcService.getCharacteristic(Api.HAP.Characteristic.PositionState)
            .on(Api.HAP.CharacteristicEventTypes.GET, (callback) => {
                callback(null, Api.HAP.Characteristic.PositionState.STOPPED);
            }));
}
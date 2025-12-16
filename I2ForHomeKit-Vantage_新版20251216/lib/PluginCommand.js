const Api = require('../api');

exports.Analyze = function (data) {
    let platform = this;
    let part = data.toString().split(/\r\n/g);

    let theContainer = platform.Container;
    let apLoader = null;

    for (let index = 0; index < part.length - 1; index++) {
        let resArray = part[index].toUpperCase().split(/[:| ]/g);

        //Api.logger.info('Analyze data = ' + resArray);

        let mode = resArray[0]; // if S 由別人指定 , R 由自身
        let cmd = resArray[1];

        switch (cmd) {
            case "GETLOAD":
            case "LOAD":
                {
                    //API.IdentifyContainer.Get();
                    let vid = resArray[2];
                    let level = parseInt(resArray[3]);
                    let isOpen = (level) ? true : false;

                    apLoader = theContainer.GetAPLoader(vid);
                    if (apLoader === undefined) continue;

                    let on = apLoader.State(Api.HAP.Categories.LIGHTBULB, Api.HAP.Characteristic.On);
                    let brightness = apLoader.State(Api.HAP.Categories.LIGHTBULB, Api.HAP.Characteristic.Brightness);

                    on.UpdateCharacteristic(isOpen);

                    //Optional
                    if (brightness !== undefined)
                        brightness.UpdateCharacteristic(level);
                }
                break;
            case "GETVARIABLE":
            case "VARIABLE":
                {
                    let vid = resArray[2];
                    let value = resArray[3];

                    apLoader = theContainer.GetAPLoader(vid);
                    if (apLoader === undefined) continue;

                    let on = apLoader.State(Api.HAP.Categories.SWITCH, Api.HAP.Characteristic.On);
                    on.UpdateCharacteristic(value);
                }
                break;
        }

    }
}

exports.Command =
{
    Load: function (device, vid, open) {
        if (open)
            device.Write('LOAD ' + vid + ' 100\r');
        else
            device.Write('LOAD ' + vid + ' 0\r');
    },
    LoadLevel: function (device, vid, open, level) {
        if (open)
            device.Write('LOAD ' + vid + ' ' + level + '\r');
        else
            device.Write('LOAD ' + vid + ' ' + 0 + '\r');
    },
    GetLoad: function (device, vid) {
        device.Write('GetLoad ' + vid + '\r');
    },
    Task: function (device, vid) {
        //console.log('TASK ' + vid + ' press\r');
        device.Write('TASK ' + vid + ' press\r');
    },
    GetVariable: function (device, vid) {
        //console.log('GetVariable ' + vid + '\r');
        device.Write('GetVariable ' + vid + '\r');
    },
    BLIND: function (device, vid, type) {
        //let val = Enum_BLIND_Type[type];
        //if (type == 1 || type == 2) { //目前TargetPosition不支援停止
        //    let level = (type == 1) ? 100 : 0;
            //apLoader.AdvancedAPI.SetLocalState(apLoader, level, "TargetPosition"); 
        //}
        device.Write('BLIND ' + vid + " " + type + '\r');
    },
    BLINDPOS: function (device, vid, level) {
        //apLoader.AdvancedAPI.SetLocalState(apLoader, level, "TargetPosition"); 
        device.Write('BLIND ' + vid + " POS " + level + '\r');
    },
}

//var Enum_BLIND_Type = ["STOP", "OPEN", "CLOSE"];
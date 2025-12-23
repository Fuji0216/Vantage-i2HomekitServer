//VID 的目的是讓Command可以第一時間找到Accessory的配置

//var VIDManager = {};

var platformItems = {};
var accessoryItems = {};

exports.pushPlatform = function (platform) {
    if (!platformItems[platform.name]) {
        platformItems[platform.name] = platform;
    }
    else
        throw new Error("Warning: skipping platform found at 'Vantage' since we already loaded the same Index from '" + platform.name + "'.");
}

exports.pushAccessory = function (accessory) {
    if (!accessoryItems[accessory.name]) {
        accessoryItems[accessory.name] = accessory;
    }
    else
        throw new Error("Warning: skipping accessory found at 'Vantage' since we already loaded the same Index from '" + accessory.name + "'.");
}

exports.runProcess = function () {
    for (const key in platformItems) {
        platformItems[key].run();
    }
    for (const key in accessoryItems) {
        accessoryItems[key].run();
    }
}

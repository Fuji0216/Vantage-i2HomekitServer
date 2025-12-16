
var path = require('path');

const API = require('../../api');
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

exports = module.exports =
{
    location: path.join(__dirname, '../'),
    GetErrorList: function () {
        return API.error;
    },
    GetPlatformContentValidation: function () {
        return PlatformContentValidation;
    },
    GetAccessoryContentValidation: function (switchType, switchSubType) {
        if (AccessoryInfo[switchType] === undefined ||
            AccessoryInfo[switchType][switchSubType] === undefined)
            return null;
        else return AccessoryInfo[switchType][switchSubType].ContentValidation;
    },
    GetCharacteristicTemplateFormat: function (switchType, switchSubType) {
        if (AccessoryInfo[switchType] === undefined ||
            AccessoryInfo[switchType][switchSubType] === undefined)
            return null;
        else return AccessoryInfo[switchType][switchSubType].CharacteristicTemplateFormat;
    },
    GetControllerTemplateInfo: function () {
        return { Name: "platform_form_vantage" }
    },
    GetContentTemplateInfo: function (switchType, switchSubType) {
        if (AccessoryInfo[switchType] === undefined ||
            AccessoryInfo[switchType][switchSubType] === undefined)
            return null;
        else return AccessoryInfo[switchType][switchSubType].ContentTemplateInfo;
    },
    GetSwitchTypeList: function () {
        return Object.keys(KindsOfSwitchType);
    },
    GetSwitchSubType: function (switchType) {
        return KindsOfSwitchType[switchType];
    },
    hasSwitchType: function (switchType, switchSubType) {
        if (KindsOfSwitchType[switchType] === undefined ||
            KindsOfSwitchType[switchType].indexOf(switchSubType) < 0)
            return false;
        else return true;
    }
}

var KindsOfSwitchType = {
    "Lightbulb": ["Load"],
    "Window_Covering": ["Task", "Blind"],
    "Switch": ["Variable_Task", "Momentary_Task"]
};

var PlatformContentValidation = [
    body('Content[TCPClient][IP]').trim().isIP().withMessage("ip address is error. ex: 192.168.1.188"),
    body('Content[TCPClient][Port]').trim().isPort().withMessage('it is not port number')
];

var AccessoryInfo = {
    "Lightbulb": {
        "Load": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Title: "Content",
                    Format: ["VID"]
                }
            ],
            ContentValidation: [
                body('Content.VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0")
            ],
            CharacteristicTemplateFormat: ["Brightness"]
        }
    },
    "Switch": {
        "Variable_Task": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Title: "VID",
                    Format: ["On_VID",
                        "Off_VID", "Variable_VID",
                        "On_Variable", "Off_Variable"]
                }
            ],
            ContentValidation: [
                body('Content.On_VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.Off_VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.Variable_VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.On_Variable').isInt({ allow_leading_zeroes: false, min: 0 }).withMessage("必須大於等於0"),
                body('Content.Off_Variable').isInt({ allow_leading_zeroes: false, min: 0 }).withMessage("必須大於等於0")
            ],
            CharacteristicTemplateFormat: []
        },
        "Momentary_Task": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Format: ["Task_VID"],
                    Title: "VID",
                }
            ],
            ContentValidation: [
                body('Content.Task_VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0")
            ],
            CharacteristicTemplateFormat: []
        }
    },
    "Window_Covering": {
        "Blind": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Format: ["BLIND"],
                    Title: "VID",
                }
            ],
            ContentValidation: [
                body('Content.BLIND').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
            ],
            CharacteristicTemplateFormat: []
        }
    },
}
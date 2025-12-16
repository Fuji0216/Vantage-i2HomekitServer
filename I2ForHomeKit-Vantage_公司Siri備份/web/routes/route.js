
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
    "Lightbulb": ["Load", "RampLoad"],
    "Thermostat": ["General"],
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
                    Title: "VID",
                    Format: ["Lightbulb"]
                }
            ],
            ContentValidation: [
                body('Content.Lightbulb').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0")
            ],
            CharacteristicTemplateFormat: ["Brightness"]
        },
        "RampLoad": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Title: "VID",
                    Format: ["Lightbulb"]
                }
            ],
            ContentValidation: [
                body('Content.Lightbulb').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0")
            ],
            CharacteristicTemplateFormat: ["Brightness"]
        },
        "Dynamic_Task": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_dictionary_form",
                    Title: "Key / VID",
                }
            ],
            ContentValidation: [
                body('Content.Dictionary').notEmpty().withMessage("項目必須大於0個"),
                body('Content.Dictionary.*.Key').trim().notEmpty().withMessage("必須填寫"),
                body('Content.Dictionary.*.Value').trim().isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須填寫,且必須大於0")
            ],
            CharacteristicTemplateFormat: []
        }
    },
    "Thermostat": {
        "General": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Title: "VID",
                    Format: ["Thermostat", "Cool_Set_Point",
                        "Heat_Set_Point", "Indoor_Temperature"]
                },
                {
                    Parent: "Custom",
                    Name: "data_number_form",
                    Title: "Others",
                    Format: ["MAX_Temperature", "Min_Temperature"]
                }
            ],
            ContentValidation: [
                body('Content.Thermostat').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.Cool_Set_Point').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.Heat_Set_Point').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.Indoor_Temperature').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Custom.MAX_Temperature').optional({ checkFalsy: true }).isInt({ allow_leading_zeroes: false, min: 24, max: 38 }).withMessage("必須是正整數秒數，範圍24~38之間"),
                body('Custom.Min_Temperature').optional({ checkFalsy: true }).isInt({ allow_leading_zeroes: false, min: 10, max: 24 }).withMessage("必須是正整數秒數，範圍10~24之間")
            ],
            CharacteristicTemplateFormat: []
        }
    },
    "Window_Covering": {
        "Task": {
            ContentTemplateInfo: [
                {
                    Parent: "Content",
                    Name: "data_number_form",
                    Format: ["OPEN",
                        "CLOSE", "STOP"],
                    Title: "VID",
                },
                {
                    Parent: "Custom",
                    Name: "data_custom_form",
                    Title: "Range Time",
                    Format: {
                        ActionTime: {
                            type: 'number'
                        },
                        Min_ActionTime: {
                            type: 'number'
                        },
                        ActionDelay: {
                            type: 'number'
                        }
                    }
                }
            ],
            ContentValidation: [
                body('Content.OPEN').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.CLOSE').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Content.STOP').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0"),
                body('Custom.ActionTime').isInt({ allow_leading_zeroes: false, min: 0 }).withMessage("必須是正整數秒數"),
                body('Custom.Min_ActionTime').isInt({ allow_leading_zeroes: false, min: 0 }).withMessage("必須是正整數秒數"),
                body('Custom.ActionDelay').isInt({ allow_leading_zeroes: false, min: 0 }).withMessage("必須是正整數秒數")
            ],
            CharacteristicTemplateFormat: []
        },
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
                }//,
                // {
                //     Parent: "Content",
                //     Name: "data_select_form",
                //     Format: [{
                //         ListName: "CommandType",
                //         Items: ["Task", "Blind"]
                //     }],
                //     Title: "CommandType",
                // }
            ],
            ContentValidation: [
                body('Content.Task_VID').isInt({ allow_leading_zeroes: false, min: 1 }).withMessage("必須大於0")
            ],
            CharacteristicTemplateFormat: []
        }
    }
}
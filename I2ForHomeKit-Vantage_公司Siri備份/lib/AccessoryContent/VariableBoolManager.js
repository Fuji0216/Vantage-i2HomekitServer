module.exports =
{
    VariableBoolManager: VariableBoolManager
}

function VariableBoolManager() {
    this.VariableTaskItems = {};
}

VariableBoolManager.prototype.New = function (content, aploader, customContainer) {
    let variableBool = new VariableBool(content, aploader, customContainer);
    let vid = content.Variable_VID;
    if (!this.VariableTaskItems[vid]) {
        this.VariableTaskItems[vid] = variableBool;
    }
    else
        throw new Error("skipping VariableBool found at 'VariableBoolManager' since we already loaded the same VID from '" + vid + "'.");

    return variableBool;
}

VariableBoolManager.prototype.GetAPLoader = function (vid) {
    if (this.VariableTaskItems[vid] !== undefined)
        return this.VariableTaskItems[vid].APLoader;
    return undefined;
}

VariableBoolManager.prototype.GetResultBool = function (vid, level) {
    if (this.VariableTaskItems[vid] !== undefined) {
        return this.VariableTaskItems[vid].GetResultBool(level);
    }
    return undefined;
}

function VariableBool(content, aploader, customContainer) {
    this.Content = content;
    this.APLoader = aploader;
    this.CustomContainer = customContainer;
}

VariableBool.prototype.GetValue = function (key) {
    return this.Content[key];
}

VariableBool.prototype.GetResultBool = function (value) {
    if (this.Content.On_Variable == value) {
        return true;
    }
    else if (this.Content.Off_Variable == value) {
        return false;
    }
}



module.exports =
{
    VIDHeadManager: VIDHeadManager
}

function VIDHeadManager() {
    this.VIDNodeItems = {};
}

VIDHeadManager.prototype.NewHead = function (content, aploader, customContainer) {
    let head = new VIDHead(content, aploader, customContainer);
    // let nodes = head.Nodes;

    for (const key in content) {
        let vid = content[key];

        if (!this.VIDNodeItems[vid]) {
            this.VIDNodeItems[vid] = head;
        }
        else
            throw new Error("skipping VIDHead found at 'VIDHeadManager' since we already loaded the same VID from '" + vid + "'.");
    }
    return head;
}

VIDHeadManager.prototype.GetAPLoader = function (vid) {
    if (this.VIDNodeItems[vid] !== undefined)
        return this.VIDNodeItems[vid].APLoader;
    return undefined;
}

VIDHeadManager.prototype.GetCustomContainer = function (vid) {
    if (this.VIDNodeItems[vid] !== undefined)
        return this.VIDNodeItems[vid].CustomContainer;
    return undefined;
}

VIDHeadManager.prototype.GetTabByVID = function (vid) {
    if (this.VIDNodeItems[vid] !== undefined) {
        let head = this.VIDNodeItems[vid];
        return head.GetTabByVID(vid);
    }
}

VIDHeadManager.prototype.GetVIDByTag = function (vid, targetType) {
    if (this.VIDNodeItems[vid] !== undefined) {
        let head = this.VIDNodeItems[vid];
        return head.GetVIDByTag(targetType);
    }
}

function VIDHead(content, aploader, customContainer) {
    this.Content = content;
    this.APLoader = aploader;
    this.CustomContainer = customContainer;
}

VIDHead.prototype.GetVID = function () {
    return this.Content[Object.keys(this.Content)[0]];
}

VIDHead.prototype.GetVIDByTag = function (typeName) {

    return this.Content[typeName];
}

VIDHead.prototype.GetTabByVID = function (vid) {
    for (const key in this.Content) {
        if (this.Content[key] == vid) {
            return key;
        }
    }
}

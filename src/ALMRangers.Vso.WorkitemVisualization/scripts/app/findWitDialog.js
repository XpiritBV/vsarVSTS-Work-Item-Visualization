var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};//ModalDialog moved from VSS/Controls/Common to . Please switch to using VSS/Controls/Dialogs/ModalDialog.
define(["require", "exports", "Scripts/App/cy/storage", "Scripts/App/cy/services", "Scripts/App/cy/WorkitemVisualizationGraph", "VSS/Controls/Dialogs"], function (require, exports, Storage, Services, WitVizGraph, Dialogs) {
    var FindWitDialog = (function (_super) {
        __extends(FindWitDialog, _super);
        function FindWitDialog(context) {
            _super.call(this);
            var self = this;
            self.context = context;
            self.messenger = new Services.messageService();
        }
        FindWitDialog.prototype.start = function () {
            var self = this;
            $("#WitIdToSearch").on("change", function () {
                if ($("#WitIdToSearch").val() !== "")
                    self.updateOkButton(true);
                if ($("#WitIdToSearch").val() === "")
                    self.updateOkButton(false);
            });
        };

        FindWitDialog.prototype.getSearchedId = function() {
            var searchedId = $("#WitIdToSearch").val();
            return { id : searchedId };
        };
        return FindWitDialog;
    })(Dialogs.ModalDialog);
    exports.FindWitDialog = FindWitDialog;
    exports.dlg = new FindWitDialog();
});
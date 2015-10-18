/*---------------------------------------------------------------------
// <copyright file="StateModelVisualization.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the State Model Visualization VSO extension by the
 //     ALM Rangers. The main application flow and logic.
 //  </summary>
//---------------------------------------------------------------------*/

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(
    ["require", "exports", "Scripts/App/services", "VSS/Controls/Dialogs"],
    function (require, exports, Services, Dialogs) {
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
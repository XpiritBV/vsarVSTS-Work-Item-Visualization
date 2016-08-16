/*---------------------------------------------------------------------
// <copyright file="findWitDialog.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The application logic for finding work item by id dialog view.
 //  </summary>
//---------------------------------------------------------------------*/

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(
    ["require", "exports", "VSS/Controls/Dialogs"],
    function (require, exports, Dialogs) {
    var FindWitDialog = (function (_super) {
        __extends(FindWitDialog, _super);
        function FindWitDialog(context) {
            _super.call(this);
            var self = this;
            self.context = context;
        }
        FindWitDialog.prototype.start = function (categories) {
            var categoryHtml;
            for (var item in categories)
            {
                if (item != null) {
                    categoryHtml += "<option value=" + item + ">" + item + "</option>";//$("<option />").val
                }
            }
            $("#selectItemType").html(categoryHtml);
        };

        FindWitDialog.prototype.getSearchedId = function() {
            var searchedId = $("#WitIdToSearch").val();
            var selectItemType = $("#selectItemType option:selected").text();
            return { id: searchedId, category: selectItemType };
        };

        return FindWitDialog;
    })(Dialogs.ModalDialog);
    exports.FindWitDialog = FindWitDialog;
});
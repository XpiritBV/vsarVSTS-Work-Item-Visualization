/*---------------------------------------------------------------------
// <copyright file="findWitDialog.ts">
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

import Controls = require("VSS/Controls")
import CboControls = require("VSS/Controls/Combos")
import Dialogs = require("VSS/Controls/Dialogs");

export class FindWitDialog  { 

    static showFindWitForm(categories: Array<string>, callbackFunction) {
        var self = this;

        var extensionContext = VSS.getExtensionContext();

        var dlgContent = $("#createFindWitDlg").clone();
        dlgContent.show();

        var cboCategoriesOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: categories
        };
        var cboCategories = Controls.create(CboControls.Combo, dlgContent.find("#cboCategories"), cboCategoriesOptions);

        //dlgContent.find("#createFindWitDlg").show();
        dlgContent.show();
        var opts = {
                width: 300,
                height: 150,
                cancelText: "Cancel",
                okText: "Find",
                content: dlgContent,
                okCallback: function (result) {                    
                    var searchText = (dlgContent.find("#SearchText")[0] as HTMLInputElement).value;
                    var category = cboCategories.getText();
                    if (parseInt(searchText) !== NaN && searchText !== "") {
                        callbackFunction(searchText, category);
                    }
                },
                title: "Find on visualization"
            };

        var dialog = Dialogs.show(Dialogs.ModalDialog, opts);
        dialog.updateOkButton(true);
        dialog.setDialogResult(true);
    }
}
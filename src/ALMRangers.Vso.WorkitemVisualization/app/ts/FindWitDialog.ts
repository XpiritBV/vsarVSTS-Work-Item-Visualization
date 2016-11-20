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

import Dialogs = require("VSS/Controls/Dialogs");

export class FindWitDialog extends Dialogs.ModalDialog {
    private context: any;
    constructor(context: any) {
        super(context);
        this.context = context;
    }
    start(categories: any) {
        var categoryHtml;
        for (var item in categories) {
            if (item != null) {
                categoryHtml += "<option value=" + item + ">" + item + "</option>";//$("<option />").val
            }
        }
        $("#selectItemType").html(categoryHtml);
    }
    getSearchedId() {
        var searchedId = $("#WitIdToSearch").val();
        var selectItemType = $("#selectItemType option:selected").text();
        return { id: searchedId, category: selectItemType };
    }

}
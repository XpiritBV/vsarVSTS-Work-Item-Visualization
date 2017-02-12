/*---------------------------------------------------------------------
// <copyright file="AddEditHighlightDialog.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The application logic for add or edit highlight dialog view.
 //  </summary>
//---------------------------------------------------------------------*/

import Controls = require("VSS/Controls")
import CboControls = require("VSS/Controls/Combos")
import Dialogs = require("VSS/Controls/Dialogs")

import * as TelemetryClient from "./TelemetryClient"

export class AddEditHighlightDialog {

    static ItemTypes = ['Work Item Type', 'Category', 'State'];
    static showAddEditHighlightDialog(title, workItemTypeArray, categoryArray, stateArray, tempSample, saveHighlightCallback, cancelCallback) {
        var self = this;
        var dialog;

        TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.showAddHighlightDialog");

        var extensionContext = VSS.getExtensionContext();

        var dlgContent = $("#createAddHighlightDlg").clone();
        dlgContent.show();

        var cboAvailableSubTypesOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: new Array<string>(),//initially empty
            indexChanged: function (index: number) {
                dialog.updateOkButton(true);
                dialog.setDialogResult(true);
            }
        };

        var cboAvailableSubTypes = Controls.create(CboControls.Combo, dlgContent.find("#cboAvailableSubTypes"), cboAvailableSubTypesOptions);

        var cboItemTypeOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: AddEditHighlightDialog.ItemTypes,
            indexChanged: function (index: number) {
                var item = AddEditHighlightDialog.ItemTypes[index];
                dialog.updateOkButton(false);
                dialog.setDialogResult(false);
                cboAvailableSubTypes.setText("");
                switch (item) {
                    case "Work Item Type":
                        cboAvailableSubTypes.setSource(workItemTypeArray);
                        break;
                    case "Category":
                        cboAvailableSubTypes.setSource(categoryArray);
                        break;
                    case "State":
                        cboAvailableSubTypes.setSource(stateArray);
                        break;
                    default:
                        break;
                }
            },
        };

        var cboItemType = Controls.create(CboControls.Combo, dlgContent.find("#cboItemType"), cboItemTypeOptions);

        if (tempSample) {
            //We're editing an existing item
            dlgContent.find("#sampleLegend").css("color", tempSample.Text);
            dlgContent.find("#sampleLegend").css("background-color", tempSample.Background);
            dlgContent.find("#sampleLegend").css("border-color", tempSample.Stroke);
            dlgContent.find('#textColor').attr("value", tempSample.Text);
            dlgContent.find("#bgColor").attr("value", tempSample.Background);
            dlgContent.find("#borderColor").attr("value", tempSample.Stroke);
            dlgContent.find("#addForm").hide();
        }
        else {
            dlgContent.find("#addForm").show();
            dlgContent.find("#sampleLegend").css("color", "#000000");
            dlgContent.find("#sampleLegend").css("background-color", "#ffffff");
            dlgContent.find("#sampleLegend").css("border-top-color", "#808080");
            dlgContent.find('#textColor').attr("value", "#000000");
            dlgContent.find("#bgColor").attr("value", "#ffffff");
            dlgContent.find("#borderColor").attr("value", "#808080");
        }

        dlgContent.find('#textColor').change(function () {
            dlgContent.find("#sampleLegend").css("color", dlgContent.find("#textColor").val());
            dlgContent.find("#sampleLegend").css("border-color", dlgContent.find("#borderColor").val());
        });

        dlgContent.find('#bgColor').change(function () {
            dlgContent.find("#sampleLegend").css("background-color", dlgContent.find("#bgColor").val());
        });

        dlgContent.find('#borderColor').change(function () {
            dlgContent.find("#sampleLegend").css("border-color", dlgContent.find("#borderColor").val());
        });

        dlgContent.show();       

        var opts = {
            width: 450,
            height: 350,
            cancelText: "Cancel",
            okText: "Save",
            okCallback: function(result) {                
                var data = {
                    textColor: dlgContent.find('#textColor').val(),
                    bgColor: dlgContent.find("#bgColor").val(),
                    borderColor: dlgContent.find("#borderColor").val(),
                    selectedField: cboAvailableSubTypes.getText(),
                    sampleColor: dlgContent.find("#sampleLegend").css("color"),
                    sampleBgColor: dlgContent.find("#sampleLegend").css("background-color"),
                    sampleBorderColor: dlgContent.find("#sampleLegend").css("border-top-color")
                };

                if ((tempSample || data.selectedField) && (data.textColor || data.bgColor || data.borderColor))
                {
                    saveHighlightCallback(data);
                }
                else {
                    TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.InvalidDataNoSave");
                }                
            },
            cancelCallback : cancelCallback,
            title: title,
            content: dlgContent
        };
        dialog = Dialogs.show(Dialogs.ModalDialog, opts);
        if (tempSample)
        {
            dialog.updateOkButton(true);
            dialog.setDialogResult(true);
        }
    }
}
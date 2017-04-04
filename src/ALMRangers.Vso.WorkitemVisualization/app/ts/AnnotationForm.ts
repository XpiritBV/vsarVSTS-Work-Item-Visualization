/*---------------------------------------------------------------------
// <copyright file="AnnotationForm.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The main application flow and logic.
 //  </summary>
//---------------------------------------------------------------------*/

import Controls = require("VSS/Controls")
import CboControls = require("VSS/Controls/Combos")
import Dialogs = require("VSS/Controls/Dialogs")

export class AnnotationForm {

    static SizeTable = ['Small', 'Medium', 'Large'];
    static ShapeTable = ['Text', 'Yellow Note', 'Red Note', 'Yellow Arrow', 'Red Arrow', 'Green Arrow'];

    static showAnnotationForm (view, node, lstNodes, okText : string, title : string, callbackFunction) {
        var self = this;

        var extensionContext = VSS.getExtensionContext();

        var dlgContent = $("#createNoteDlg").clone();
        dlgContent.show();

        var cboSizeOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: AnnotationForm.SizeTable
        };

        var cboSize = Controls.create(CboControls.Combo, dlgContent.find("#cboSize"), cboSizeOptions);

        var cboShapeOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: AnnotationForm.ShapeTable
        };

        var cboShape = Controls.create(CboControls.Combo, dlgContent.find("#cboShape"), cboShapeOptions);


        var lstNodesId = lstNodes.map(function (i) {
            return {
                id: i.data("id"),
                text: AnnotationForm.getHumanText(i)
            };
        });
        var cboPinToOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: lstNodesId.map(function (i) { return i.text; })
        };

        var cboPin2Node = Controls.create(CboControls.Combo, dlgContent.find("#cboNode"), cboPinToOptions);

        if (node != null) {
            (dlgContent.find("#noteTitle")[0] as HTMLInputElement).value = node.title;
            (dlgContent.find("#noteTxt")[0] as HTMLInputElement).value = node.content

            cboSize.setText(node.size);
            cboShape.setText(node.shapeType);
            if (node.linkedToId != null) {
                cboPin2Node.setText(lstNodesId.filter(function (i) { return i.id == node.linkedToId; })[0].text);
            }
        }
        else {
            cboSize.setText(AnnotationForm.SizeTable[0]);
            cboShape.setText(AnnotationForm.ShapeTable[0]);
        }

        dlgContent.find("#createNoteDlg").show();

        var options = {
            width: 404,
            height: 350,
            cancelText: "Cancel",
            okText: okText,
            title: title,
            content: dlgContent,
            okCallback: function (result) {
                //Fetch IDs
                var id = [];
                var title = (dlgContent.find("#noteTitle")[0] as HTMLInputElement).value;
                var txt = (dlgContent.find("#noteTxt")[0] as HTMLInputElement).value;

                var linkedToId = null;
                if (cboPin2Node.getSelectedIndex() != -1) {
                    linkedToId = lstNodesId[cboPin2Node.getSelectedIndex()].id;
                }

                var size = cboSize.getText();
                var shapeType = cboShape.getText();
                callbackFunction(title, txt, shapeType, size, linkedToId);
            }
        };

        var dialog = Dialogs.show(Dialogs.ModalDialog, options);
        dialog.updateOkButton(true);
        dialog.setDialogResult(true);

    };

    static getHumanText(i) {
        var s = "";
        switch (i.data("category")) {
            case "File":
                s = i.data("category") + " " + i.data("file");
                break;
            case "Changeset":
                s = i.data("category") + " " + i.data("origId");
                break;
            case "Commit":
                s = i.data("category") + " " + i.data("origId");
                break;
            default:
                s = i.data("id") + "-" + i.data("title")
                break;

        };
        return s;
    }
}
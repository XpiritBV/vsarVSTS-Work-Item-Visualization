/*---------------------------------------------------------------------
// <copyright file="AnnotationForm.js">
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

//TODO: Highlight path to selected node
//TODO: Highlight elements that are being added

define(["require", "exports", "VSS/Controls", "VSS/Controls/Combos",  "VSS/Controls/Dialogs"],
    function (require, exports, Controls, CboControls, Dialogs) {
        var AnnotationForm = (function () {
            var SizeTable = ['Small', 'Medium', 'Large'];
            var ShapeTable = ['Text', 'Yellow Note', 'Red Note', 'Yellow Arrow', 'Red Arrow', 'Green Arrow'];
         
            
            function AnnotationForm() {
                
            }


            AnnotationForm.prototype.showAnnotationForm = function (view, node, lstNodes, callbackFunction) {
                var self = this;

                var extensionContext = VSS.getExtensionContext();

                var dlgContent = $("#createNoteDlg").clone();
                dlgContent.show();

                //var cboSizeOptions = { //: CtrlCombos.IComboOptions = {
                //    mode: "drop",
                //    allowEdit: false,
                //    source: SizeTable
                //};

                //var cboSize = Controls.create(CboControls.Combo, dlgContent.find("#cboSize"), cboSizeOptions);

                var cboShapeOptions = { //: CtrlCombos.IComboOptions = {
                    mode: "drop",
                    allowEdit: false,
                    source: ShapeTable
                };

                var cboShape = Controls.create(CboControls.Combo, dlgContent.find("#cboShape"), cboShapeOptions);


                var lstNodesId = lstNodes.map(function (i) { return { id: i.data("id"), text: i.data("id") + "-" + i.data("title") }; });
                var cboPinToOptions = { //: CtrlCombos.IComboOptions = {
                    mode: "drop",
                    allowEdit: false,
                    source: lstNodesId.map(function (i) { return i.text; })
                };

                var cboPin2Node = Controls.create(CboControls.Combo, dlgContent.find("#cboNode"), cboPinToOptions);

                if (node != null) {
                    dlgContent.find("#noteTitle")[0].value = node.title;
                    dlgContent.find("#noteTxt")[0].value = node.content

                    cboShape.setText(node.shapeType);
                    if (node.linkedToId != null) {
                        cboPin2Node.setText(lstNodesId.filter(function (i) { return i.id == node.linkedToId; })[0].text);
                    }
                }
                else {
                    cboShape.setText(ShapeTable[0]);
                }

                dlgContent.find("#createNoteDlg").show();

                var options = {
                    width: 404,
                    height: 310,
                    cancelText: "Cancel",
                    okText: "Add",
                    title: "Add Annotation",
                    content: dlgContent,
                    okCallback: function (result) {
                        //Fetch IDs
                        var id = [];
                        var title = dlgContent.find("#noteTitle")[0].value;
                        var txt = dlgContent.find("#noteTxt")[0].value;

                        var linkedToId = null;
                        if (cboPin2Node.getSelectedIndex() != -1) {
                            linkedToId = lstNodesId[cboPin2Node.getSelectedIndex()].id;
                        }

                        var size = "Small"; //cboSize.getText();
                        var shapeType = cboShape.getText();
                        callbackFunction(title, txt, shapeType, size, linkedToId);
                    }
                };

                var dialog = Dialogs.show(Dialogs.ModalDialog, options);
                dialog.updateOkButton(true);
                dialog.setDialogResult(true);

            };
            return AnnotationForm;
        })();

        exports.annotationForm = new AnnotationForm();
    });
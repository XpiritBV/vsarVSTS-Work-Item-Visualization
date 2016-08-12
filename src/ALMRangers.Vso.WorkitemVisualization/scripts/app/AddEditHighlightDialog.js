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

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(
    ["require", "exports", "VSS/Controls/Dialogs", "scripts/app/TelemetryClient"],
    function (require, exports, Dialogs, TelemetryClient) {
        var AddEditHighlightDialog = (function (_super) {
            __extends(AddEditHighlightDialog, _super);
            function AddEditHighlightDialog(context) {
                _super.call(this);
                var self = this;
                self.context = context;
            }
            AddEditHighlightDialog.prototype.start = function (data) {
                TelemetryClient.getClient().trackEvent("AddHiglight");

                var self = this;
                var workItemTypesHtml;
                var categoryHtml;
                var stateHtml;
                var workItemTypeArray = data.workItemTypeArray;
                var categoryArray = data.categoryArray;
                var stateArray = data.stateArray;
                var tempSample = data.tempSample;

                //During these loops we have to strip out existing values so that they don't create
                //a new legend item for an existing one (for which we haven't retrieved the formating for
                //since we want them to edit it
                for (var i = 0; i < workItemTypeArray.length; i++) {
                    if (workItemTypeArray[i] != null) {
                        workItemTypesHtml += "<option value=" + workItemTypeArray[i] + ">" + workItemTypeArray[i] + "</option>";
                    }
                }

                for (var i = 0; i < categoryArray.length; i++) {
                    if (categoryArray[i] != null) {
                        categoryHtml += "<option value=" + categoryArray[i] + ">" + categoryArray[i] + "</option>";
                    }
                }

                for (var i = 0; i < stateArray.length; i++) {
                    if (stateArray[i] != null) {
                        stateHtml += "<option value=" + stateArray[i] + ">" + stateArray[i] + "</option>";
                    }
                }

                if (tempSample !== "") {
                    //We're editing an existing item
                    $("#sampleLegend").css("color", tempSample.Text);
                    $("#sampleLegend").css("background-color", tempSample.Background);
                    $("#sampleLegend").css("border-color", tempSample.Stroke);

                    $('#textcolor').attr("value", tempSample.Text);
                    $("#bgcolor").attr("value", tempSample.Background);
                    $("#bordercolor").attr("value", tempSample.Stroke);
                    $("#addForm").hide();
                }
                else {
                    $("#addForm").show();
                    $("#sampleLegend").css("color", "#000000");
                    $("#sampleLegend").css("background-color", "#ffffff");
                    $("#sampleLegend").css("border-top-color", "#808080");

                    $('#textcolor').attr("value", "#000000");
                    $("#bgcolor").attr("value", "#ffffff");
                    $("#bordercolor").attr("value", "#808080");
                }

                $('#textcolor').change(function () {
                    $("#sampleLegend").css("color", $("#textcolor").val());
                    $("#sampleLegend").css("border-color", $("#bordercolor").val());
                });

                $('#bgcolor').change(function () {
                    $("#sampleLegend").css("background-color", $("#bgcolor").val());
                });

                $('#bordercolor').change(function () {
                    $("#sampleLegend").css("border-color", $("#bordercolor").val());
                });

                $("#itemType").change(function () {
                    switch ($("#itemType").val()) {
                        case "Work Item Type":
                            $("#selectItemType").html(workItemTypesHtml);
                            break;
                        case "Category":
                            $("#selectItemType").html(categoryHtml);
                            break;
                        case "State":
                            $("#selectItemType").html(stateHtml);
                            break;
                        default:
                            break;
                    }
                });
            };

            AddEditHighlightDialog.prototype.getData = function () {
                return {
                    textColor: $('#textcolor').val(),
                    bgColor: $("#bgcolor").val(),
                    borderColor: $("#bordercolor").val(),
                    selectedField: $("#selectItemType").find('option:selected').text(),
                    sampleColor: $("#sampleLegend").css("color"),
                    sampleBgColor: $("#sampleLegend").css("background-color"),
                    sampleBorderColor: $("#sampleLegend").css("border-top-color")
                }
            };
            return AddEditHighlightDialog;
        })(Dialogs.ModalDialog);
        exports.AddEditHighlightDialog = AddEditHighlightDialog;
    });
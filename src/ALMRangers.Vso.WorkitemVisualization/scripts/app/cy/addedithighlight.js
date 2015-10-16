var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};//ModalDialog moved from VSS/Controls/Common to . Please switch to using VSS/Controls/Dialogs/ModalDialog.
define(["require", "exports", "Scripts/App/cy/storage", "Scripts/App/cy/services", "Scripts/App/cy/WorkitemVisualizationGraph", "Scripts/App/cy/LegendGrid", "VSS/Controls/Dialogs"], function (require, exports, Storage, Services, WitVizGraph, LegendGrid, Dialogs) {
    var addEditHighlightDialog = (function (_super) {
        __extends(addEditHighlightDialog, _super);
        function addEditHighlightDialog(context) {
            _super.call(this);
            var self = this;
            self.context = context;
            self.messenger = new Services.messageService();
            self.graph = WitVizGraph.graph;
        }
        addEditHighlightDialog.prototype.start = function (data) {
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

            $("#itemType").change(function() {
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

        addEditHighlightDialog.prototype.getData = function () {
            return {
                textColor : $('#textcolor').val(),
                bgColor : $("#bgcolor").val(),
                borderColor: $("#bordercolor").val(),
                selectedField: $("#selectItemType").find('option:selected').text(),
                sampleColor: $("#sampleLegend").css("color"),
                sampleBgColor: $("#sampleLegend").css("background-color"),
                sampleBorderColor: $("#sampleLegend").css("border-top-color")
            }
        };
        return addEditHighlightDialog;
    })(Dialogs.ModalDialog);
    exports.addEditHighlightDialog = addEditHighlightDialog;
    exports.dlg = new addEditHighlightDialog();
});
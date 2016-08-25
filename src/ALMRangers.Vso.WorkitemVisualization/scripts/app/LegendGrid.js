/*---------------------------------------------------------------------
// <copyright file="LegendGrid.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The legend grid that stores the highlights currently applied on graph.
 //  </summary>
//---------------------------------------------------------------------*/

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

//White: #ffffff
//Black: #000000
//Gray:  #808080

define(["require", "exports", "VSS/Utils/Core",
    "VSS/Controls", "VSS/Controls/Grids", "scripts/app/WorkitemVisualizationGraph"],
    function (require, exports, Core, UIControls, Grids, WorkItemVisualizationGraph) {
    /**
     *   This object will be draw the work item grid.
     */
    var LegendGrid = (function (_super) {
        __extends(LegendGrid, _super);
        function LegendGrid(options) {
            _super.call(this, options);

            this._selectedId = '';
            var _nodeBeingEdited = "";
            var _grid = null;
            var _gridData = null;
            this._graph = WorkItemVisualizationGraph.graph;
        }

        //var grid;
        //var gridData = [];
        var tempSample = "";

        /**
         *   Adds a new row onto the grid
         */
        LegendGrid.prototype._addRow = function(row) {
            var nodeId = row.Field.replace(/ /g, "_");
            var found = false;
            if (this._gridData == null) {
                this._gridData = [];
            }
            for (var i = 0; i < this._gridData.length; i++) {
                var tempId = this._gridData[i][0].replace(/ /g, "_");
                if (tempId === nodeId) {
                    this._gridData[i] = [nodeId, row.Field, row];
                    found = true;
                    break;
                }
            }

            if (!found) {
                this._gridData.push([nodeId, row.Field, row]);
            }

            this._grid.setDataSource(this._gridData, null, this._getColumns());
        }

        /**
         *   Returns the grid context menu items
         */
        LegendGrid.prototype._getContextMenuItems = function() {
            return [
                {
                    id: "edit-item",
                    text: "Edit",
                    icon: "icon-edit",
                    showText: true
                },
                {
                    id: "remove-item",
                    text: "Remove",
                    icon: "icon-delete",
                    showText: true
                },
                {
                    id: "reset-item",
                    text: "Reset",
                    icon: "icon-undo",
                    showText: true
                }
            ];
        }

        /**
         *   Returns the columns for the grid
         */
        LegendGrid.prototype._getColumns = function() {
            return [
                { index: 0, text: "Id", width: 0, hidden: true },
                { index: 1, text: "Item", width: 200 },
                {
                    index: 2,
                    text: "Text",
                    width: 100,
                    getCellContents: function(rowInfo, dataIndex, expandedState, level, column, indentIndex, columnOrder) {
                        return $("<div class='grid-cell item-format'/>")
                            .css("color", this.getColumnValue(dataIndex, 2).Text)
                            .css("border-color", this.getColumnValue(dataIndex, 2).Stroke)
                            .css("background-color", this.getColumnValue(dataIndex, 2).Background)
                            .css("text-align", "center")
                            .css("border-style", "solid")
                            .css("border-width", "thin")
                            .css("width", "45px")
                            .text("Text");
                    }
                }
            ];
        };

        /**
         *   Initialize called for each control.  Parse the passed in build nodes looking for work items.  Then pass those to
         *   grid to render.
         */
        LegendGrid.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
            this._createGrid();
            this._gridData = [];
        };

        /**
         *   Creates the grid
         */
        LegendGrid.prototype._createGrid = function () {
            this._grid = Grids.Grid.createIn("#legend", {
                width: "90%",
                height: "90%",
                source: this._gridData,
                gutter: {
                    contextMenu: true
                },
                contextMenu: {
                    items: this._getContextMenuItems(),
                    executeAction: Core.delegate(this, this._onMenuClick)
                },
                columns: this._getColumns()
            });
        }

        /**
         *   Handles the context menu click event
         */
        LegendGrid.prototype._onMenuClick = function (e) {
            var index = this._grid.getSelectedDataIndex();
            switch (e._commandName) {
                case "edit-item":
                    this._editItem(index);
                    break;
                case "remove-item":
                    this._removeItem(index);
                    break;
                case "reset-item":
                    this._resetItem(index);
                    break;
            }
        }

        LegendGrid.prototype._getDefaultNodeForIndex = function(index) {
            var node = this._gridData[index][2];

            //Reset the node to the default
            node.Background = "#fff";
            node.BackgroundApply = true;
            node.Stroke = "#000";
            node.StrokeApply = true;
            node.Text = "#000000";
            node.TextApply = true;

            return node;
        }

        LegendGrid.prototype._resetItem = function (index) {
            //first, get the node so we can remove the formatting
            var node = this._getDefaultNodeForIndex(index);

            this._gridData[index][2] = node;

            this._grid.setDataSource(this._gridData, null, this._getColumns());

            this.ReApplyLegend(node);
        }

        LegendGrid.prototype._removeItem = function (index) {
            TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.removeHighlightRule");
            //first, get the node so we can remove the formatting
            var node = this._getDefaultNodeForIndex(index);

            this._gridData.splice(index, 1);

            this._grid.setDataSource(this._gridData, null, this._getColumns());

            this.ReApplyLegend(node);
        }


        /**
         *   Edits an item on the row
         */
        LegendGrid.prototype._editItem = function(index) {
            //Get the formatted text at the given index
            tempSample = this._gridData[index][2];
            this._nodeBeingEdited = this._gridData[index][0].replace(/_/g, " ");
            this.ShowLegend("Edit Legend (" + this._nodeBeingEdited + ")");
        }

        /**
         *   Shows the legend dialog and the contents of the legend dialog
         */
        LegendGrid.prototype.ShowLegend = function (dialogTitle) {
            var self = this;
            //Get the categories (first, as a test)
            var workItemTypeArray = [];
            var categoryArray = [];
            var stateArray = [];

            var nodes = self._graph.cy.nodes();
            for (var i = 0; i < nodes.length; i++) {
                //Just do work item types right now
                this._addItem(nodes[i].data("workItemType"), workItemTypeArray);
                this._addItem(nodes[i].data("category"), categoryArray);
                this._addItem(nodes[i].data("state"), stateArray);
            }

            function saveHighlight(result) {
                TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.saveHighlightRule");
                var node = {};
                //Initialize
                node.TextApply = false;
                node.BackgroundApply = false;
                node.StrokeApply = false;

                if (tempSample !== "") {
                    node.Field = self._nodeBeingEdited;
                    if (tempSample.Text !== result.textColor) { node.TextApply = true; }
                    if (tempSample.Background !== result.bgColor) { node.BackgroundApply = true; }
                    if (tempSample.Stroke !== result.borderColor) { node.StrokeApply = true; }
                }
                else {
                    node.Field = result.selectedField;
                    //These are the default values for a node
                    if (result.sampleColor !== "black") { node.TextApply = true; }
                    if (result.sampleBgColor !== "white") { node.BackgroundApply = true; }
                    if (result.sampleBorderColor !== "gray") { node.StrokeApply = true; }
                }

                node.Text = result.textColor;
                node.Background = result.bgColor;
                node.Stroke = result.borderColor;

                self._updateLegend(node);
                tempSample = "";
            }


            VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg) {
                var addEditHighlightDialog;
                var opts = {
                    width: 450,
                    height: 265,
                    cancelText: "Cancel",
                    okText: "Save",
                    getDialogResult: function () { return addEditHighlightDialog ? addEditHighlightDialog.getData() : null },
                    okCallback: saveHighlight,
                    title: dialogTitle
                };
                dlg.openDialog(VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".work-item-visualization-add-edit-highlight-dialog", opts).then(function (dialog) {
                    dialog.updateOkButton(true);
                    dialog.getContributionInstance("work-item-visualization-add-edit-highlight-dialog").then(function (ci) {
                        addEditHighlightDialog = ci;
                        addEditHighlightDialog.start({ workItemTypeArray: workItemTypeArray, categoryArray: categoryArray, stateArray: stateArray, editNode : self._nodeBeingEdited, tempSample : tempSample });
                    }, function (err) {
                        alert(err.message);
                    });
                });
            });
        }

        LegendGrid.prototype._updateLegend = function (node) {
            this._addRow(node);

            this.ReApplyLegend(node);
        }

        LegendGrid.prototype.ReApplyLegend = function () {
            if (WorkItemVisualizationGraph.graph.isGraphLoaded()) {
                //Get the nodes and loop through them
                var nodes = WorkItemVisualizationGraph.graph.getAllNodes();
                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    this.ApplyLegendToNode(n);
                }
            }
        }

        LegendGrid.prototype.ApplyLegendToNode = function (graphNode) {
            //Find the node
            var n = graphNode;
            if (this._gridData != null) {
                var mergedBackground = null;
                var mergedStroke=null;
                var mergedText=null;

                for (var i = 0; i < this._gridData.length; i++) {
                    var node = this._gridData[i][2];
                    if ((n.data("workItemType") === node.Field) || (n.data("category") === node.Field) || (n.data("state") === node.Field) || (n.data("assignedTo") === node.Field) || (n.data("outcome") === node.Field)) {
                        if (node.BackgroundApply) {
                            mergedBackground = node.Background;
                        }
                        if (node.StrokeApply) {
                            mergedStroke = node.Stroke;
                        }
                        if (node.TextApply) {
                            mergedText = node.Text;
                        }
                    }
                }

                var content = n.data("content");
                if (n.data("category") === "Work Item") {
                    var image = this._graph.getWitBackground(n.data("workItemType"), content, mergedBackground, mergedStroke, mergedText );
                    n.data("bgImage", image);

                } else {
                    var image = this._graph.getArtifactBackground(n.data("category"), content, mergedBackground, mergedStroke, mergedText);
                    n.data("bgImage", image);
                }
            }
        }



        /**
         *   This is strictly a utility function with checks to see
         *   if a given item is already in the array and if not
         *   adds it. This is used to iterate over the nodes and get
         *   the properties a user can use to set a legend for
         */
        LegendGrid.prototype._addItem = function(item, itemArray) {
            var found = false;
            var foundAgain = false;

            for (var i = 0; i < itemArray.length; i++) {
                if (itemArray[i] === item) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (this._gridData == null) {
                    this._gridData = [];
                }
                //We made it here so the item can be added, but we need to check
                //and see if there is already an entry in the legend for it
                for (var i = 0; i < this._gridData.length; i++) {
                    if (this._gridData[i][2].Field === item) {
                        foundAgain = true;
                        break;
                    }
                }
                if (!foundAgain) {
                    itemArray.push(item);
                }
            }
        }

        return LegendGrid;
    })(UIControls.BaseControl);
    exports.LegendGrid = LegendGrid;
});
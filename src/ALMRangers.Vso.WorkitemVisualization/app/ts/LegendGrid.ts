/*---------------------------------------------------------------------
// <copyright file="LegendGrid.ts">
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

import Core = require("VSS/Utils/Core")
import UIControls = require("VSS/Controls")
import Grids = require("VSS/Controls/Grids")

import * as WorkitemVisualizationGraph from "./WorkitemVisualizationGraph"
import * as TelemetryClient from "./TelemetryClient"
import * as NodeTemplate from "./NodeTemplate"
import * as Node from "./Node"

//White: #ffffff
//Black: #000000
//Gray:  #808080
export class LegendGrid extends UIControls.BaseControl //TODO: use builtin grid instead. 
{
    private _selectedId = '';
    private _nodeBeingEdited = "";
    private _grid = null;
    private _gridData = null;
    private _graph : WorkitemVisualizationGraph.WorkitemVisualizationGraph;
    private tempSample : ISampleData = null;
    private _nodeTemplateFactory : NodeTemplate.NodeTemplateFactory;

    constructor(options) {
        super(options)
        this._graph = WorkitemVisualizationGraph.graph; //TODO: ADM instead
        this._nodeTemplateFactory = new NodeTemplate.NodeTemplateFactory();
    }

    _addRow(row) {
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
    _getContextMenuItems() {
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
    _getColumns() {
        return [
            { index: 0, text: "Id", width: 0, hidden: true },
            { index: 1, text: "Item", width: 200 },
            {
                index: 2,
                text: "Text",
                width: 100,
                getCellContents: function (rowInfo, dataIndex, expandedState, level, column, indentIndex, columnOrder) {
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
    initialize() {
        super.initialize();
        this._createGrid();
        this._gridData = [];
    };

    /**
     *   Creates the grid
     */
    _createGrid() {
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
    _onMenuClick(e) {
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

    _getDefaultNodeForIndex(index) {
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

    _resetItem(index) {
        //first, get the node so we can remove the formatting
        var node = this._getDefaultNodeForIndex(index);

        this._gridData[index][2] = node;

        this._grid.setDataSource(this._gridData, null, this._getColumns());

        this.ReApplyLegend();
    }

    _removeItem(index) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.removeHighlightRule");
        //first, get the node so we can remove the formatting
        var node = this._getDefaultNodeForIndex(index);

        this._gridData.splice(index, 1);

        this._grid.setDataSource(this._gridData, null, this._getColumns());

        this.ReApplyLegend();
    }


    /**
     *   Edits an item on the row
     */
    _editItem(index) {
        //Get the formatted text at the given index
        this.tempSample = this._gridData[index][2];
        this._nodeBeingEdited = this._gridData[index][0].replace(/_/g, " ");
        this.ShowLegend("Edit Legend (" + this._nodeBeingEdited + ")");
    }

    /**
     *   Shows the legend dialog and the contents of the legend dialog
     */
    ShowLegend(dialogTitle) {
        var self = this;
        //Get the categories (first, as a test)
        var workItemTypeArray = [];
        var categoryArray = [];
        var stateArray = [];

        var nodes = self._graph.getAllNodes();
        for (var i = 0; i < nodes.length; i++) {
            //Just do work item types right now
            this._addItem(nodes[i].data("workItemType"), workItemTypeArray);
            this._addItem(nodes[i].data("category"), categoryArray);
            this._addItem(nodes[i].data("state"), stateArray);
        }

        function saveHighlight(result) {
            TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.saveHighlightRule");
            var nodeStyle = new NodeStyling();
            //Initialize
            nodeStyle.TextApply = false;
            nodeStyle.BackgroundApply = false;
            nodeStyle.StrokeApply = false;

            if (self.tempSample) {
                nodeStyle.Field = self._nodeBeingEdited;
                if (self.tempSample.Text !== result.textColor) { nodeStyle.TextApply = true; }
                if (self.tempSample.Background !== result.bgColor) { nodeStyle.BackgroundApply = true; }
                if (self.tempSample.Stroke !== result.borderColor) { nodeStyle.StrokeApply = true; }
            }
            else {
                nodeStyle.Field = result.selectedField;
                //These are the default values for a node
                if (result.sampleColor !== "black") { nodeStyle.TextApply = true; }
                if (result.sampleBgColor !== "white") { nodeStyle.BackgroundApply = true; }
                if (result.sampleBorderColor !== "gray") { nodeStyle.StrokeApply = true; }
            }

            nodeStyle.Text = result.textColor;
            nodeStyle.Background = result.bgColor;
            nodeStyle.Stroke = result.borderColor;

            self._updateLegend(nodeStyle);
            self.tempSample = null;
        }


        VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg : IHostDialogService) {
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
                    addEditHighlightDialog.start({ workItemTypeArray: workItemTypeArray, categoryArray: categoryArray, stateArray: stateArray, editNode: self._nodeBeingEdited, tempSample: self.tempSample });
                }, function (err) {
                    alert(err.message);
                });
            });
        });
    }

    _updateLegend(node) {
        this._addRow(node);

        this.ReApplyLegend();
    }

    ReApplyLegend() {
        if (this._graph.isGraphLoaded()) {
            //Get the nodes and loop through them
            var nodes = this._graph.getAllNodes();
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                this.ApplyLegendToNode(n);
            }
        }
    }

    ApplyLegendToNode(graphNode) {
        //Find the node
        var n = graphNode;
        if (this._gridData != null) {
            var mergedBackground = null;
            var mergedStroke = null;
            var mergedText = null;

            for (var i = 0; i < this._gridData.length; i++) {
                var nodeStyle = this._gridData[i][2];
                if ((n.data("workItemType") === nodeStyle.Field) || (n.data("category") === nodeStyle.Field) || (n.data("state") === nodeStyle.Field) || (n.data("assignedTo") === nodeStyle.Field) || (n.data("outcome") === nodeStyle.Field)) {
                    if (nodeStyle.BackgroundApply) {
                        mergedBackground = nodeStyle.Background;
                    }
                    if (nodeStyle.StrokeApply) {
                        mergedStroke = nodeStyle.Stroke;
                    }
                    if (nodeStyle.TextApply) {
                        mergedText = nodeStyle.Text;
                    }
                }
            }

            var content = n.data("content");
            if (n.data("category") === "Work Item") {
                var image = this._nodeTemplateFactory.getWitBackground(n.data("workItemType"), content, mergedBackground, mergedStroke, mergedText);
                n.data("bgImage", image);

            } else {
                var image = this._nodeTemplateFactory.getArtifactBackground(n.data("category"), content, mergedBackground, mergedStroke, mergedText);
                n.data("bgImage", image);
            }
        }
    }

    //TODO: the idea was to use GraphItem<T> as type here, but we are lacking some things then.
    ApplyLegendToNodeData(nodeData) {
        //Find the node
        var n = nodeData;
        if (this._gridData != null) {
            var mergedBackground = null;
            var mergedStroke = null;
            var mergedText = null;

            for (var i = 0; i < this._gridData.length; i++) {
                var nodeStyle = this._gridData[i][2];
                //author field on commits / changesets
                if ((n.data.workItemType === nodeStyle.Field) || (n.data.category === nodeStyle.Field) || (n.data.state === nodeStyle.Field) || (n.data.assignedTo === nodeStyle.Field) || (n.data.outcome === nodeStyle.Field)) {
                    if (nodeStyle.BackgroundApply) {
                        mergedBackground = nodeStyle.Background;
                    }
                    if (nodeStyle.StrokeApply) {
                        mergedStroke = nodeStyle.Stroke;
                    }
                    if (nodeStyle.TextApply) {
                        mergedText = nodeStyle.Text;
                    }
                }
            }

            var content = n.data.content;
            if (n.data.category === "Work Item") {
                var image = this._nodeTemplateFactory.getWitBackground(n.data.workItemType, content, mergedBackground, mergedStroke, mergedText);
                n.data.bgImage = image;

            } else {
                var image = this._nodeTemplateFactory.getArtifactBackground(n.data.category, content, mergedBackground, mergedStroke, mergedText);
                n.data.bgImage = image;
            }
        }
    }



    /**
     *   This is strictly a utility function with checks to see
     *   if a given item is already in the array and if not
     *   adds it. This is used to iterate over the nodes and get
     *   the properties a user can use to set a legend for
     */
    _addItem(item, itemArray) {
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
}

class NodeStyling
{
    public TextApply = false;
    public BackgroundApply = false;
    public StrokeApply = false;

    public Field : string;

    public Text : string;
    public Background : string;
    public Stroke : string;
}

interface ISampleData
{
    Text : string;
    Background : string;
    Stroke : string;
}
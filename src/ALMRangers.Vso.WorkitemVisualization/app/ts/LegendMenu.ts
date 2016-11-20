/*---------------------------------------------------------------------
// <copyright file="LegendMenu.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The menu in the highlight view.
 //  </summary>
//---------------------------------------------------------------------*/

import Controls = require("VSS/Controls");
import MenuControls = require("VSS/Controls/Menus");
import UtilsCore = require("VSS/Utils/Core");
import * as LegendGrid from "./LegendGrid"

export class LegendItemsMenu extends Controls.BaseControl
{
    private _menu : any;
    private legendGrid : any; //= LegendGrid.LegendGrid.enhance(LegendGrid.LegendGrid, $("#legend-content"));

    constructor(options : any)
    {
        super(options);
        this._menu = null;
        this.legendGrid = LegendGrid.LegendGrid.enhance(LegendGrid.LegendGrid, $("#legend-content"));
    }

    initialize () {
            super.initialize();
            this._createToolbar();
        };

        _createToolbar () {
            this._menu = Controls.BaseControl.createIn(MenuControls.MenuBar, this._element.find(".legend-hub-pivot-toolbar"), {
                items: this._createToolbarItems()
            });
            MenuControls.menuManager.attachExecuteCommand(UtilsCore.delegate(this, this._onToolbarItemClick));
        };

        /*
         *  Create the actual toolbar items
         */
        _createToolbarItems () : any[] {
            var items = [];

            items.push({ id: "add-legend", text: "Add Highlight", title: "Add Highlight", showText: true, icon: "icon-add-small", disabled: true });

            return items;
        };

        ReApplyLegend = function() {
            this.legendGrid.ReApplyLegend();
        }

        ApplyLegendToNode (node) {
            this.legendGrid.ApplyLegendToNode(node);
        }

        ApplyLegendToNodeData (nodeData) {
            this.legendGrid.ApplyLegendToNodeData(nodeData);
        }

        /*
         *  Handle a button click on the toolbar
         */
        _onToolbarItemClick (sender, args) {
            var command = args.get_commandName(), commandArgument = args.get_commandArgument(), that = this, result = false;
            switch (command) {
                case "add-legend":
                    this.legendGrid.ShowLegend("Highlight Item");
                    break;
                default:
                    result = true;
                    break;
            }
            return result;
        };


        /*
         *  Updates the add menu item to enable or disable it. It starts
         *  off as disabled by default.
         */
        EnableAddItem (enabled) {
            this._menu.updateCommandStates(
                [
                    {
                        id: "add-legend",
                        disabled: !enabled
                    }
                ]
            );
        }
}

Controls.Enhancement.registerEnhancement(LegendItemsMenu, ".hub-view");
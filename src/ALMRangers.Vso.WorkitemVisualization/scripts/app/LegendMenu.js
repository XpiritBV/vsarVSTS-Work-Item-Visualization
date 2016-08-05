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

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

define(["require", "exports", "VSS/Utils/Core", "VSS/Controls", "VSS/Controls/Menus", "scripts/app/LegendGrid"],
    function (require, exports, Core, Controls, MenuControls, LegendGrid) {    

    var ItemsView = (function (_super) {
        __extends(ItemsView, _super);
        function ItemsView(options) {
            _super.call(this, options);

            this._menu = null;
        }

        var legendGrid = LegendGrid.LegendGrid.enhance(LegendGrid.LegendGrid, $("#legend-content"));
        //legendGrid._createGrid();

        /*
         *   Initialize will be called when this control is created.  This will setup the UI, 
         *   attach to events, etc.
         */
        ItemsView.prototype.initialize = function () {
            _super.prototype.initialize.call(this);

            this._createToolbar();
        };

        ItemsView.prototype._createToolbar = function () {
            this._menu = Controls.BaseControl.createIn(MenuControls.MenuBar, this._element.find(".legend-hub-pivot-toolbar"), {
                items: this._createToolbarItems()
            });
            MenuControls.menuManager.attachExecuteCommand(Core.delegate(this, this._onToolbarItemClick));
        };

        /*
         *  Create the actual toolbar items
         */
        ItemsView.prototype._createToolbarItems = function () {
            var items = [];

            items.push({ id: "add-legend", text: "Add Highlight", title: "Add Highlight", showText: true, icon: "icon-add-small", disabled: true });

            return items;
        };

        ItemsView.prototype.ReApplyLegend = function() {
            legendGrid.ReApplyLegend();
        }

        ItemsView.prototype.ApplyLegendToNode = function (node) {
            legendGrid.ApplyLegendToNode(node);
        }

        /*
         *  Handle a button click on the toolbar
         */
        ItemsView.prototype._onToolbarItemClick = function (sender, args) {
            var command = args.get_commandName(), commandArgument = args.get_commandArgument(), that = this, result = false;
            switch (command) {
                case "add-legend":
                    legendGrid.ShowLegend("Highlight Item");
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
        ItemsView.prototype.EnableAddItem = function (enabled) {
            this._menu.updateCommandStates(
                [
                    {
                        id: "add-legend",
                        disabled: !enabled
                    }
                ]
            );
        }

        return ItemsView;
    })(Controls.BaseControl);
    exports.ItemsView = ItemsView;

    Controls.Enhancement.registerEnhancement(ItemsView, ".hub-view");
});
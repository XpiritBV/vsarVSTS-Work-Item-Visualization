var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

define(["require", "exports", "VSS/Utils/Core", "VSS/Host",
    "VSS/Controls", "VSS/Controls/Menus", "VSS/Controls/Common", "Scripts/App/cy/WorkitemVisualizationGraph", "Scripts/App/cy/Storage"],
    function (require, exports, Core, VSS_HOST, Controls, MenuControls, CommonControls, WorkitemVisualizationGraph, Storage) {

    var ItemsView = (function (_super) {
        __extends(ItemsView, _super);

        function ItemsView(options) {
            _super.call(this, options);
            this._menu = null;
            ItemsView.prototype._graph = null;
            this._graph = WorkitemVisualizationGraph.graph;
        }

        //var _callback;
        var _diagramType = "";
        var _lastDirectionCommand = "";
        var _linkType = "Tree";
        var _splitter = null;
        var _splitterPaneOnOff = "on";
        var _loadWorkItemGraphCallback = null;
        

        /*
         *   Initialize will be called when this control is created.  This will setup the UI, 
         *   attach to events, etc.
         */
        ItemsView.prototype.initialize = function () {
            _super.prototype.initialize.call(this);

            this._createToolbar();
        };

        ItemsView.prototype.setLoadWorkItemGraphCallback = function(callback) {
            _loadWorkItemGraphCallback = callback;
        }

        ItemsView.prototype._createToolbar = function () {
            this._menu = Controls.BaseControl.createIn(MenuControls.MenuBar, this._element.find(".hub-pivot-toolbar"), {
                items: this._createToolbarItems()
            });
            MenuControls.menuManager.attachExecuteCommand(Core.delegate(this, this._onToolbarItemClick));
            _splitter = Controls.Enhancement.ensureEnhancement(CommonControls.Splitter, $(".right-hub-splitter"));
            
            _splitter.noSplit();
            _splitterPaneOnOff = "off";
        };

        /*
         *  Create the actual toolbar items
         */
        ItemsView.prototype._createToolbarItems = function () {
            var items = [];
            var subItems2 = [];


            subItems2.push({ id: "left-to-right", text: "Left to Right", title: "Left to Right", showText: true, icon: "icon-left-to-right" });
            subItems2.push({ id: "top-to-bottom", text: "Top to Bottom", title: "Top to Bottom", showText: true, icon: "icon-top-to-bottom" });

            items.push({ id: "toggle-minimap", text: "Show/hide the overview map", title: "Show/hide the overview map", showText: false, icon: "icon-minimap", disabled: true });

            items.push({ separator: true });

            items.push({ id: "zoom-in", text: "Zoom In", title: "Zoom In", showText: false, icon: "icon-zoom-in", disabled: true });
            items.push({ id: "zoom-out", text: "Zoom Out", title: "Zoom Out", showText: false, icon: "icon-zoom-out", disabled: true });
            items.push({ id: "zoom-100", text: "Zoom 100%", title: "Zoom to 100%", showText: false, icon: "icon-zoom-100", disabled: true });
            items.push({ id: "fit-to", text: "Fit to screen", title: "Fit to screen", showText: false, icon: "icon-fit-to", disabled: true });

            items.push({ separator: true });

            items.push({ id: "direction", text: "Direction", title: "Direction", showText: false, icon: "icon-left-to-right", disabled: true, childItems: subItems2 });

            items.push({ separator: true });


            items.push({ id: "toggle-legend-pane", text: "Toggle Legend Pane on/off", title: "Toggle Legend Pane on/off", showText: false, icon: "icon-legend-pane", disabled: false, cssClass: "right-align" });
            items.push({ id: "find-work-item", text: "Find Work Item", title: "Find Work Item", showText: false, icon: "icon-find", disabled: false, cssClass: "right-align" });

            items.push({ id: "export-graph", text: "Export Graph", title: "Export Graph", showText: false, icon: "icon-document", disabled: true });

            return items;
        };

        /*
         *  Fit the graph to the current window size
         */
        ItemsView.prototype._fitTo = function () {
            if (!$("#fit-to").hasClass("disabled")) {
                this._graph.fitTo();
            }
        };

        /*
         *  Zoom the diagram in one unit
         */
        ItemsView.prototype._zoomIn = function () {
            if (!$("#zoom-in").hasClass("disabled")) {
                this._graph.zoomIn();
            }
        };

        /*
         *  Zoom the diagram out one unit
         */
        ItemsView.prototype._zoomOut = function () {
            if (!$("#zoom-out").hasClass("disabled")) {
                this._graph.zoomOut();
            }
        };

        /*
         *  Set the diagram to 100%
         */
        ItemsView.prototype._zoom100 = function () {
            if (!$("#zoom-100").hasClass("disabled")) {
                this._graph.zoomTo100();
            }
        };

        ItemsView.prototype.ResetOverview = function () {
            this._graph.resetMinimap();
        }

        /*
         *  Show or hide the minimap
         */
        ItemsView.prototype._toggleMiniMap = function () {
            this._graph.toggleMinimap();
        }

        /*
         *  Change the direction the diagram is drawn from
         */
        ItemsView.prototype._direction = function (e, parentUniqueId) {
            if (this._graph != null) {
                switch (e) {
                    case "left-to-right":
                        this._graph.direction = 'LR';
                        this._graph.refreshLayout();
                        break;
                    case "top-to-bottom":
                        this._graph.direction = 'TB';
                        this._graph.refreshLayout();
                        break;
                };
                this._clearDirectionIcon(parentUniqueId);
                //Set the correct icon on the parent menu item
                $("#" + parentUniqueId).children("span").addClass("icon-" + e);
                _lastDirectionCommand = e;
            }
        };

        /*
         *  Remove the icon from the parent menu item
         */
        ItemsView.prototype._clearDirectionIcon = function (parentUniqueId) {
            $("#" + parentUniqueId).children("span").removeClass("icon-left-to-right");
            $("#" + parentUniqueId).children("span").removeClass("icon-top-to-bottom");
        };


        /*
         *  Handle a button click on the toolbar
         */
        ItemsView.prototype._onToolbarItemClick = function (sender, args) {
            var command = args.get_commandName(), commandArgument = args.get_commandArgument(), that = this, result = false;
            switch (command) {
                case "zoom-in":
                    this._zoomIn();
                    break;
                case "zoom-out":
                    this._zoomOut();
                    break;
                case "zoom-100":
                    this._zoom100();
                    break;
                case "fit-to":
                    this._fitTo();
                    break;
                case "left-to-right":
                    this._direction(command, this._menu._selectedItem._getUniqueId());
                    break;
                case "top-to-bottom":
                    this._direction(command, this._menu._selectedItem._getUniqueId());
                    break;
                case "toggle-legend-pane":
                    this._toggleLegendPane();
                    break;
                case "toggle-minimap":
                    this._toggleMiniMap();
                    break;
                case "find-work-item":
                    this._findWorkItem();
                    break;
                case "export-graph":
                    this._exportGraph();
                    break;
                default:
                    result = true;
                    break;
            }
            return result;
        };

        ItemsView.prototype._exportGraph = function () {
            var d = new Date();
            var witType = "";
            var witId = "";
            var png = this._graph.exportImage();
            var rootNodes = this._graph.cy.$('node').roots();
            if (!rootNodes.empty()) {
                witType = rootNodes[0].data("workItemType");
                witId = rootNodes[0].data("origId");
            }
            var newImage = $("<img />").attr("src", png);
            var imageDiv = $("<div />"); 
            imageDiv.append(newImage);
            var newWindow = window.open();
            var newDocument = newWindow.document;
            newDocument.write("<html><head><title>Visualization Output</title></head><body>");
            newDocument.write("<div style='font-family: Segoe UI Light; font-size: 18px; font-weight: 100; height: 24px'>Visualization of " + witType + " " + witId + "</div>");
            newDocument.write("<div style='font-family: Segoe UI Light; font-size: 12px; font-weight: 100; padding-bottom: 5px'>Generated " + d.toLocaleDateString() + "</div>");
            newDocument.write($("<div />").append(imageDiv).html());
            newDocument.write("</body></html>");
            newDocument.close();
        };

        ItemsView.prototype._findWorkItem = function () {
            var vsoStore = new Storage.VsoStoreService();
            var findWorkItemDialog; 
            var self = this;
            var opts = {
                width: 200,
                height: 200,
                cancelText: "Cancel",
                okText: "Find",
                getDialogResult : function () { return findWorkItemDialog ? findWorkItemDialog.getSearchedId() : null },
                okCallback: function (result) {
                    vsoStore.getWorkItem(result.id, _loadWorkItemGraphCallback);
                },
                title: "Find work item"
            };
            VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg) {
                dlg.openDialog(VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".almrangers.WorkitemVisualization.findWitDialog", opts).then(function (dialog) {
                    dialog.updateOkButton(true);
                    dialog.getContributionInstance("almrangers.WorkitemVisualization.findWitDialog").then(function (ci) {
                        findWorkItemDialog = ci;
                        findWorkItemDialog.start();
                    }, function (err) {
                        alert(err.message);
                    });
                });
            });
        }



        ItemsView.prototype._toggleLegendPane = function () {
            var legendPane = $("#legend-pane");

            if (_splitterPaneOnOff === "on") {
                legendPane.css("display", "none");
                _splitter.noSplit();
                _splitterPaneOnOff = "off";
            }
            else {
                _splitter.horizontal();
                _splitter.split();
                legendPane.css("display", "block");
                _splitterPaneOnOff = "on";
            }
        }

        ItemsView.prototype.GetLinkType = function () {
            return _linkType;
        };

        ItemsView.prototype.GetDiagramType = function () {
            return _diagramType;
        };

        /*
         *  Enables the toolbar menu items - to be called after the work item diagram is set initially
         */
        ItemsView.prototype.EnableToolbar = function() {
            this._menu.updateCommandStates([
                { id: "zoom-in", disabled: false },
                { id: "zoom-out", disabled: false },
                { id: "zoom-100", disabled: false },
                { id: "fit-to", disabled: false },
                { id: "connector-type", disabled: false },
                { id: "direction", disabled: false },
                { id: "graph-type", disabled: false },
                { id: "force-directed", disabled: false },
                { id: "find-work-item", disabled: false },
                { id: "toggle-minimap", disabled: false },
                { id: "export-graph", disabled: false }
            ]);
        }


        return ItemsView;
    })(Controls.BaseControl);
    exports.ItemsView = ItemsView;

    Controls.Enhancement.registerEnhancement(ItemsView, ".hub-view");
});
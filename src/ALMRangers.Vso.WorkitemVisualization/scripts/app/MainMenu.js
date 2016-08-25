/*---------------------------------------------------------------------
// <copyright file="MainMenu.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The main menu (toolbar) of the application.
 //  </summary>
//---------------------------------------------------------------------*/

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

define(["require", "exports", "VSS/Utils/Core",
    "VSS/Controls", "VSS/Controls/Combos", "VSS/Controls/Menus", "VSS/Controls/Splitter", "VSS/Controls/Dialogs","VSS/Context",
     "scripts/app/AnnotationForm", "scripts/app/WorkitemVisualization", "scripts/app/WorkitemVisualizationGraph", "scripts/app/Storage", "scripts/app/TelemetryClient"],
    function (require, exports, Core, Controls, CboControls, MenuControls, Splitter, Dialogs, Context,
        AnnotationForm, WorkitemVisualization, WorkitemVisualizationGraph, Storage, TelemetryClient ) {

        var ItemsView = (function (_super) {
            __extends(ItemsView, _super);

            function ItemsView(options) {
                _super.call(this, options);
                this._menu = null;
                this._graph = WorkitemVisualizationGraph.graph;
            }

            //var _callback;
            var _diagramType = "";
            var _lastDirectionCommand = "";
            var _linkType = "Tree";
            var _splitter = null;
            var _splitterPaneOnOff = "on";
            var _loadWorkItemGraphCallback = null;

            var _favoritesList =[];
            var favoritesMenu = [];
            var _notes=[];

            /*
             *   Initialize will be called when this control is created.  This will setup the UI,
             *   attach to events, etc.
             */
            ItemsView.prototype.initialize = function () {
                _super.prototype.initialize.call(this);
                this._LoadFavoritesFromSettings();
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
                //var splitterOptions = { initialSize : 250, minWidth : 250, maxWidth: 500, fixedSide : "right" };
                _splitter = Controls.Enhancement.ensureEnhancement(Splitter.Splitter, $(".right-hub-splitter"));
                //_splitter = Controls.create(Splitter.Splitter, $(".right-hub-splitter"), splitterOptions);

                //_splitter.collapse();
                _splitter.noSplit();
                _splitterPaneOnOff = "off";
            };

            /*
             *  Create the actual toolbar items
             */
            ItemsView.prototype._createToolbarItems = function () {
                var items = [];

                var subItems2 = [];
                subItems2.push({ id: "left-to-right", text: "Left to Right", title: "Left to Right", showText: true, icon: "icon-left-to-right-witviz" });
                subItems2.push({ id: "top-to-bottom", text: "Top to Bottom", title: "Top to Bottom", showText: true, icon: "icon-top-to-bottom-witviz" });

                items.push({ id: "toggle-minimap", text: "Show/hide the overview map", title: "Show/hide the overview map", showText: false, icon: "icon-minimap-witviz", disabled: true });

                items.push({ separator: true });

                items.push({ id: "zoom-in", text: "Zoom In", title: "Zoom In", showText: false, icon: "icon-zoom-in-witviz", disabled: true });
                items.push({ id: "zoom-out", text: "Zoom Out", title: "Zoom Out", showText: false, icon: "icon-zoom-out-witviz", disabled: true });
                items.push({ id: "zoom-100", text: "Zoom 100%", title: "Zoom to 100%", showText: false, icon: "icon-zoom-100-witviz", disabled: true });
                items.push({ id: "fit-to", text: "Fit to screen", title: "Fit to screen", showText: false, icon: "icon-fit-to-witviz", disabled: true });

                items.push({ separator: true });

                items.push({ id: "direction", text: "Direction", title: "Direction", showText: false, icon: "icon-left-to-right-witviz", disabled: true, childItems: subItems2 });

                items.push({ separator: true });
                items.push({ id: "add-annotation", text: "Add Annotation", title: "Add Annotation", showText: false, disabled: true, icon: "bowtie-icon bowtie-comment icon-add-annotation-witviz" });
                items.push({ id: "export-graph", text: "Export Visualization", title: "Export Visualization", showText: false, icon: "icon-export-witviz", disabled: true });

                //Use reverse order for right align:
                items.push({ id: "toggle-legend-pane", text: "Toggle Legend Pane on/off", title: "Toggle Legend Pane on/off", showText: false, icon: "icon-legend-pane-witviz", disabled: false, cssClass: "right-align" });
                items.push({ id: "find-work-item", text: "Find Work Item", title: "Find Work Item", showText: false, icon: "icon-find-witviz", disabled: true, cssClass: "right-align" });
                items.push({ id: "shared-visualizations", text: "Shared Visualizations", title: "Shared Visualizations", showText: false, icon: "icon-favorite-in icon-shared-visualization-witviz", disabled: true, childItems: favoritesMenu, cssClass: "right-align" });
                items.push({ separator: true, cssClass: "right-align" });

                return items;
            };

        /*
         *  Fit the graph to the current window size
         */
        ItemsView.prototype._fitTo = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.fitTo");
            if (!$("#fit-to").hasClass("disabled")) {
                this._graph.fitTo();
            }
        };

        /*
         *  Zoom the diagram in one unit
         */
        ItemsView.prototype._zoomIn = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.zoomIn");
            if (!$("#zoom-in").hasClass("disabled")) {
                this._graph.zoomIn();
            }
        };

        /*
         *  Zoom the diagram out one unit
         */
        ItemsView.prototype._zoomOut = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.zoomOut");
            if (!$("#zoom-out").hasClass("disabled")) {
                this._graph.zoomOut();
            }
        };

        /*
         *  Set the diagram to 100%
         */
        ItemsView.prototype._zoom100 = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.zoom100");
            if (!$("#zoom-100").hasClass("disabled")) {
                this._graph.zoomTo100();
            }
        };

        ItemsView.prototype.ResetOverview = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.ResetOverview");
            this._graph.resetMinimap();
        }

        /*
         *  Show or hide the minimap
         */
        ItemsView.prototype._toggleMiniMap = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.toggleMinimap");
            this._graph.toggleMinimap();
        }

        /*
         *  Change the direction the diagram is drawn from
         */
        ItemsView.prototype._direction = function (e, parentUniqueId) {
            if (this._graph != null) {
                switch (e) {
                    case "left-to-right":
                        TelemetryClient.getClient().trackEvent("MainMenu.reOrder.Left2Right");
                        this._graph.direction = 'LR';
                        this._graph.refreshLayout();
                        break;
                    case "top-to-bottom":
                        TelemetryClient.getClient().trackEvent("MainMenu.reOrder.Top2Bottom");
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

            ItemsView.prototype._addNote = function () {
                TelemetryClient.getClient().trackEvent("MainMenu.showAnnotationFormDialog");
                //Prompt user for name and type
                var frm = AnnotationForm.annotationForm;
                var witviz = WorkitemVisualization.witviz;

                var node = frm.showAnnotationForm(this, null, this._graph.getNodes("[category != 'Annotation']"), function (title, txt, shapeType, size, linkedToId) {
                    TelemetryClient.getClient().trackEvent("AnnotationFormDialog.addNote");
                    var node = witviz.addNote(_notes.length, title, txt, shapeType, size, null, linkedToId);
                    _notes.push(node);
                });
            }

            ItemsView.prototype._addFavorit = function () {
                TelemetryClient.getClient().trackEvent("MainMenu.showSaveSharedVisualisationDialog");
                //Prompt user for name and type
                var view = this;
                var extensionContext = VSS.getExtensionContext();

                var dlgContent = $("#createFavoriteDlg").clone();
                dlgContent.show();
                dlgContent.find("#createFavoriteDlg").show();

                var options= {
                    width: 300,
                    height: 150,
                    cancelText: "Cancel",
                    okText: "Save",
                    title: "Save as shared visualization",
                    content: dlgContent,
                    okCallback: function(result) {
                        //Fetch IDs
                        TelemetryClient.getClient().trackEvent("SaveSharedVisualizationDialog.saveVisualization");
                        _favoritesList.push({ name: dlgContent.find("#FavoriteName")[0].value, elements: view._graph.cy.json().elements });
                        view._SaveFavorites2Settings(_favoritesList, "Account")
                        view._RebuildFavoritesMenu();
                    }
                };

                var dialog = Dialogs.show(Dialogs.ModalDialog, options);
                dialog.updateOkButton(true);
                dialog.setDialogResult(true);
            }

            ItemsView.prototype._LoadFavorite = function (favorite) {
                TelemetryClient.getClient().trackEvent("MainMenu.loadSelectedSharedVisualization");
                var self = this;

                _selectedFavorite = favorite;

                this._graph.cy.load(favorite.elements);
                this._graph.fitTo();

                var witviz = WorkitemVisualization.witviz;
                witviz.refreshWorkItemNodes();
            }

            ItemsView.prototype._LoadWorkItemsWithPossition = function () {

            }

            ItemsView.prototype._RebuildFavoritesMenu = function () {
                // Get an account-scoped document in a collection
                var self= this;
                favoritesMenu = [];
                favoritesMenu.push({ id: "favorites-add", text: "Save as shared", title: "Save as shared visualization", showText: true, icon: "bowtie-icon bowtie-math-plus" });
                favoritesMenu.push({ separator: true });

                _favoritesList.forEach(function (n) {
                    favoritesMenu.push({ id: "select-favorit-" + n.name, text: n.name, title: n.name, showText: true });
                });

                this._menu.updateItems(this._createToolbarItems());
            }

            ItemsView.prototype._LoadFavoritesFromSettings = function () {
                // Get an account-scoped document in a collection
                var self = this;
                favoritesMenu = [];
                favoritesMenu.push({
                    id: "favorites-add", text: "Save as shared", title: "Save as shared visualization", showText: true, icon: "bowtie-icon bowtie-math-plus"
                    });
                favoritesMenu.push({ separator: true });
                VSS.getService(VSS.ServiceIds.ExtensionData).then(function (dataService) {
                    dataService.getDocument(VSS.getWebContext().project.name, "ProjectShared").then(function (doc) {
                        //_favoritesList = docs.filter(function (i) { return i.id == "ProjectShared"; })[0].List;
                        TelemetryClient.getClient().trackEvent("MainMenu.loadSharedVisualizationsFromProject", null, { sharedVisualizationCount: doc.List.length });
                        _favoritesList = doc.List;
                        self._RebuildFavoritesMenu();
                    },
                    function (err) {
                        self._RebuildFavoritesMenu();
                    });
                });
            }

            ItemsView.prototype._SaveFavorites2Settings = function (favoList, scopeType) {

                VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
                    // Set a user-scoped preference
                    dataService.setDocument(VSS.getWebContext().project.name, { id: "ProjectShared", __etag:-1, List: favoList }).then(function (value) {
                        console.log("Saved list " + value);
                    });
                });

            }

         /*  Handle a button click on the toolbar
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
                case "favorites-add":
                    this._addFavorit();
                    break;
                case "add-annotation":
                    this._addNote();
                    break;

                default:
                    if (command.indexOf("select-favorit-") == 0) {
                        var self = this;
                        _favoritesList.forEach(function (m) {
                            if (command == "select-favorit-" + m.name) {
                                self._LoadFavorite(m);
                            }
                        });
                    }
                    else {
                        result = true;
                    }

                    break;
            }
            return result;
        };

        ItemsView.prototype._exportGraph = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.exportGraph");

            var self = this;
            if (self.detectIE()) {
                TelemetryClient.getClient().trackEvent("MainMenu.exportGraph.IESecurityError");
                var options = { buttons: null, title: "Can not export in IE", contentText: "Export does not work in IE due to SVG toDataUrl throwing SecurityError. Try Edge, FireFox, Chrome, or other browsers." };
                Dialogs.show(Dialogs.ModalDialog, options);
                return;
            }

            var witType = "";
            var witId = "";
            var png = self._graph.exportImage();
            var rootNodes = self._graph.cy.$('node').roots();
            if (!rootNodes.empty()) {
                witType = rootNodes[0].data("workItemType");
                witId = rootNodes[0].data("origId");
            }

            VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg) {
                var printGraphDialog;

                //TODO: later make dialog same size as window and offer full screen option
                var opts = {
                    width: window.screen.width,
                    height: window.screen.height,
                    title: "Export Work Item Visualization",
                    buttons: null
                };

                dlg.openDialog(VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".work-item-visualization-print-graph-dialog", opts).then(function (dialog) {
                    dialog.getContributionInstance("work-item-visualization-print-graph-dialog").then(function (ci) {
                        printGraphDialog = ci;
                        printGraphDialog.start(png, witType, witId);
                    }, function (err) {
                        alert(err.message);
                    });
                });
            });
        };

         /**
         * detect IE
         * returns version of IE or false, if browser is not Internet Explorer
         */
        ItemsView.prototype.detectIE = function() {
            var ua = window.navigator.userAgent;

            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            // other browser
            return false;
        }

        ItemsView.prototype._findWorkItem = function () {
            TelemetryClient.getClient().trackEvent("MainMenu.showFindWorkItemDialog");

            var self = this;

            var categoryArray = {};

            var nodes = self._graph.cy.nodes();
            for (var i = 0; i < nodes.length; i++) {
                if (!categoryArray[nodes[i].data("category")]) {
                    categoryArray[nodes[i].data("category")] = nodes[i].data("category");
                }
            }

            var vsoStore = new Storage.VsoStoreService();

            VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg) {
                var findWorkItemDialog;

                var opts = {
                        width: 200,
                        height: 150,
                        cancelText: "Cancel",
                        okText: "Find",
                        getDialogResult: function () { return findWorkItemDialog ? findWorkItemDialog.getSearchedId() : null },
                        okCallback: function (result) {
                            if (parseInt(result.id) !== NaN && result.id !== "") {
                                TelemetryClient.getClient().trackEvent("FindWorkItemDialog.findAndHighlight");
                                self._graph.findAndHighlight(result.id, result.category);
                            }
                        },
                        title: "Find on visualization"
                };

                dlg.openDialog(VSS.getExtensionContext().publisherId + "." +VSS.getExtensionContext().extensionId + ".work-item-visualization-find-wit-dialog", opts).then(function (dialog) {
                    dialog.updateOkButton(true);
                    dialog.getContributionInstance("work-item-visualization-find-wit-dialog").then(function (ci) {
                        findWorkItemDialog = ci;
                        findWorkItemDialog.start(categoryArray);
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
                { id: "export-graph", disabled: false },
                { id: "add-annotation", disabled: false },
                { id: "shared-visualizations", disabled: false }
            ]);
        }


        return ItemsView;
    })(Controls.BaseControl);
    exports.ItemsView = ItemsView;

    Controls.Enhancement.registerEnhancement(ItemsView, ".hub-view");
});
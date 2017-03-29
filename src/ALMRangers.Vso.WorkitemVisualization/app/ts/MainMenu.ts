/*---------------------------------------------------------------------
// <copyright file="MainMenu.ts">
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

import Core = require("VSS/Utils/Core")
import Controls = require("VSS/Controls")
import CboControls = require("VSS/Controls/Combos")
import MenuControls = require("VSS/Controls/Menus")
import Splitter = require("VSS/Controls/Splitter")
import Dialogs = require("VSS/Controls/Dialogs")
import Navigation = require("VSS/Controls/Navigation")
import Context = require("VSS/Context")

//import * as PrintGraph from "./PrintGraph"
import * as FindWitDialog from "./FindWitDialog"
import * as NSFavoritesDialogs from "./FavoritesDialogs"
import * as AnnotationForm from "./AnnotationForm"
import * as WorkitemVisualization from "./WorkitemVisualization"
import * as Storage from "./VsoStoreService"
import * as TelemetryClient from "./TelemetryClient"
import * as WorkitemVisualizationGraph from "./WorkitemVisualizationGraph"
import * as Common from "./Common"


export class MainMenu extends Controls.BaseControl //TODO: use builtin grid instead. 
{
    private _selectedFavorite: any;
    private _diagramType = "";
    private _lastDirectionCommand = "";
    private _linkType = "Tree";
    private _splitter = null;
    private _splitterPaneOnOff = "on";
    private _loadWorkItemGraphCallback = null;

    private _favoritesList = [];
    private favoritesMenu = [];
    private _notes = []; //TODO: Check why this is here and if its used anywhere. Notes are on graph and dont really need separate holder?
    private _menu: MenuControls.MenuBar;
    private _graph: WorkitemVisualizationGraph.WorkitemVisualizationGraph;

    //private _filterLoaded : boolean = false;
    constructor(options) {
        super(options);
        this._menu = null;
        this._graph = WorkitemVisualizationGraph.graph;
    }

    /*
     *   Initialize will be called when this control is created.  This will setup the UI,
     *   attach to events, etc.
     */
    initialize() {
        super.initialize();
        this._LoadFavoritesFromSettings();
        this._createToolbar();
        this._createFilter();
    };

    setLoadWorkItemGraphCallback(callback) {
        this._loadWorkItemGraphCallback = callback;
    }

    //MVP version of filtering using pivot, until we have more tested combo box solution
    _createFilter() {
        var self = this;
        var container = $(".filter-container");
        Controls.create(Navigation.PivotFilter, container, {
            behavior: "dropdown",
            text: "Filter",
            items: [
                { id: "f-all", text: "All", value: Common.FilterTypes.All },
                { id: "f-WorkItemsOnly", text: "Work Items only", value: Common.FilterTypes.WorkItemOnly, selected: true },
                { id: "f-WorkItemsWithChanges", text: "Work Items with changes", value: Common.FilterTypes.WorkItemWithChanges },
                { id: "f-WorkItemsWithChangesAndFiles", text: "Work Items with changes and files", value: Common.FilterTypes.WorkItemWithChangesAndFiles }
            ],
            change: function (item) {
                var newValue = item.value;
                self._graph.changeFilter(newValue);
            }
        });
    }

    _createToolbar() {
        this._menu = Controls.BaseControl.createIn(MenuControls.MenuBar, this._element.find(".hub-pivot-toolbar"), {
            items: this._createToolbarItems()
        }) as MenuControls.MenuBar;
        MenuControls.menuManager.attachExecuteCommand(Core.delegate(this, this._onToolbarItemClick));
        this._splitter = Controls.Enhancement.ensureEnhancement(Splitter.Splitter, $(".right-hub-splitter"));
        //TODO: Use the correct splitter thing
        // var options : Splitter.ISplitterOptions = {
        //     initialSize: 358
        // };
        // this._splitter = Controls.create(Splitter.Splitter, $(".right-hub-splitter"), options);

        this._splitter.noSplit();
        this._splitterPaneOnOff = "off";
    };

    /*
     *  Create the actual toolbar items
     */
    _createToolbarItems() {
        var items = [];

        var subItems2 = [];
        subItems2.push({ id: "left-to-right", text: "Left to Right", title: "Left to Right", showText: true, icon: "icon-left-to-right-witviz" });
        subItems2.push({ id: "top-to-bottom", text: "Top to Bottom", title: "Top to Bottom", showText: true, icon: "icon-top-to-bottom-witviz" });

        //Dont add for IE, since it doesnt work
        if (!this.detectIE())
        {
            items.push({ id: "toggle-minimap", text: "Show/hide the overview map", title: "Show/hide the overview map", showText: false, icon: "icon-minimap-witviz", disabled: true });
            items.push({ separator: true });
        }
        items.push({ id: "zoom-in", text: "Zoom In", title: "Zoom In", showText: false, icon: "icon-zoom-in-witviz", disabled: true });
        items.push({ id: "zoom-out", text: "Zoom Out", title: "Zoom Out", showText: false, icon: "icon-zoom-out-witviz", disabled: true });
        items.push({ id: "zoom-100", text: "Zoom 100%", title: "Zoom to 100%", showText: false, icon: "icon-zoom-100-witviz", disabled: true });
        items.push({ id: "fit-to", text: "Fit to screen", title: "Fit to screen", showText: false, icon: "icon-fit-to-witviz", disabled: true });

        items.push({ separator: true });

        items.push({ id: "direction", text: "Direction", title: "Direction", showText: false, icon: "icon-left-to-right-witviz", disabled: true, childItems: subItems2 });

        items.push({ separator: true });
        items.push({ id: "add-annotation", text: "Add Annotation", title: "Add Annotation", showText: false, disabled: true, icon: "bowtie-icon bowtie-comment icon-add-annotation-witviz" });
        
        //Dont add for IE, since it doesnt work
        if (!this.detectIE())
        {
            items.push({ id: "export-graph", text: "Export Visualization", title: "Export Visualization", showText: false, icon: "icon-export-witviz", disabled: true });
        }
        //Use reverse order for right align:
        items.push({ id: "toggle-legend-pane", text: "Toggle Legend Pane on/off", title: "Toggle Legend Pane on/off", showText: false, icon: "icon-legend-pane-witviz", disabled: false, cssClass: "right-align" });
        items.push({ id: "find-work-item", text: "Find Work Item", title: "Find Work Item", showText: false, icon: "icon-find-witviz", disabled: true, cssClass: "right-align" });
        items.push({ id: "shared-visualizations", text: "Shared Visualizations", title: "Shared Visualizations", showText: false, icon: "icon-favorite-in icon-shared-visualization-witviz", disabled: true, childItems: this.favoritesMenu, cssClass: "right-align" });
        items.push({ separator: true, cssClass: "right-align" });

        return items;
    };

    /*
     *  Fit the graph to the current window size
     */
    _fitTo() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.fitTo");
        if (!$("#fit-to").hasClass("disabled")) {
            this._graph.fitTo();
        }
    };

    /*
     *  Zoom the diagram in one unit
     */
    _zoomIn() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.zoomIn");
        if (!$("#zoom-in").hasClass("disabled")) {
            this._graph.zoomIn();
        }
    };

    /*
     *  Zoom the diagram out one unit
     */
    _zoomOut() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.zoomOut");
        if (!$("#zoom-out").hasClass("disabled")) {
            this._graph.zoomOut();
        }
    };

    /*
     *  Set the diagram to 100%
     */
    _zoom100() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.zoom100");
        if (!$("#zoom-100").hasClass("disabled")) {
            this._graph.zoomTo100();
        }
    };

    ResetOverview() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.ResetOverview");
        this._graph.resetMinimap();
    }

    /*
     *  Show or hide the minimap
     */
    _toggleMiniMap() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.toggleMinimap");
        var self = this;
        if (self.detectIE()) {
            TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.toggleMiniMap.IESecurityError");
            var options = { buttons: null, title: "Can not show minimap in IE", contentText: "Minimap uses SVG toDataUrl which in IE11 and before throws SecurityError. Try Edge, FireFox, Chrome, or other browsers." };
            Dialogs.show(Dialogs.ModalDialog, options);
            return;
        }
        this._graph.toggleMinimap();
    }

    /*
     *  Change the direction the diagram is drawn from
     */
    _direction(e, parentUniqueId) {
        if (this._graph != null) {
            switch (e) {
                case "left-to-right":
                    TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.reOrder.Left2Right");
                    this._graph.direction = 'LR'; //TODO: graph should expose directions available and allow setting only two by using enum
                    this._graph.refreshLayout();
                    break;
                case "top-to-bottom":
                    TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.reOrder.Top2Bottom");
                    this._graph.direction = 'TB';//TODO: graph should expose directions available and allow setting only two by using enum
                    this._graph.refreshLayout();
                    break;
            };
            this._clearDirectionIcon(parentUniqueId);
            //Set the correct icon on the parent menu item
            $("#" + parentUniqueId).children("span").addClass("icon-" + e);
            this._lastDirectionCommand = e;
        }
    };

    /*
     *  Remove the icon from the parent menu item
     */
    _clearDirectionIcon(parentUniqueId) {
        $("#" + parentUniqueId).children("span").removeClass("icon-left-to-right");
        $("#" + parentUniqueId).children("span").removeClass("icon-top-to-bottom");
    };

    _addNote() {
        var self = this;
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.showAnnotationFormDialog");
        //Prompt user for name and type
        var frm = AnnotationForm.AnnotationForm;
        var witviz = WorkitemVisualization.witviz;

        var hiddenCategoriesFilter = self._graph.getCategoryFilter(self._graph.getHideCategories(null), false, '@!=')
        var nodes = self._graph.getNodes("[category @!= 'Annotation']" + hiddenCategoriesFilter);

        var node = frm.showAnnotationForm(this, null, nodes, function (title, txt, shapeType, size, linkedToId) {
            TelemetryClient.TelemetryClient.getClient().trackEvent("AnnotationFormDialog.addNote");
            var node = witviz.addNote(self._notes.length, title, txt, shapeType, size, null, linkedToId);
            self._notes.push(node);
        });
    }

    _addFavorit() {
        //Prompt user for name and type
        var self = this;

        var saveFavoriteCallback = function (text: string) {
            var selectedIndex = -1;

            var findIndexAndItem = function (item, index) {
                if (item.name === text) {
                    selectedIndex = index;
                    return true;
                }
                else {
                    return false;
                }
            }

            var selectedItems = self._favoritesList.filter(findIndexAndItem);
            //update existing
            if (selectedItems.length > 0 && selectedIndex > -1) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("SaveSharedVisualizationDialog.updateSavedVisualization");
                var item = selectedItems[0];
                item.elements = self._graph.json().elements;
            }
            //new item
            else{
                TelemetryClient.TelemetryClient.getClient().trackEvent("SaveSharedVisualizationDialog.saveVisualization");
                self._favoritesList.push({ name: text, elements: self._graph.json().elements });
            }
            
            self._SaveFavoritesToSettings(self._favoritesList, "Account")
            self._RebuildFavoritesMenu();
        }

        var tempFavoritesList = Array<string>();
        self._favoritesList.forEach(function (n) {
            tempFavoritesList.push(n.name);
        });

        NSFavoritesDialogs.FavoritesDialogs.showAddFavoriteDialog(tempFavoritesList, saveFavoriteCallback);
    }

    _removeFavorite() {
        var self = this;

        var removeFavoriteCallback = function (selectedFavorite: string) {
            //Fetch IDs
            var selectedIndex = -1;

            var findIndexAndItem = function (item, index) {
                if (item.name === selectedFavorite) {
                    selectedIndex = index;
                    return true;
                }
                else {
                    return false;
                }
            }

            var selectedItems = self._favoritesList.filter(findIndexAndItem);
            if (selectedItems.length > 0 && selectedIndex > -1) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("SaveSharedVisualizationDialog.removedSavedVisualization");
                self._favoritesList.splice(selectedIndex, 1);
                self._SaveFavoritesToSettings(self._favoritesList, "Account")
                self._RebuildFavoritesMenu();
            }
        }

        var tempFavoritesList = Array<string>();
        self._favoritesList.forEach(function (n) {
            tempFavoritesList.push(n.name);
        });

        NSFavoritesDialogs.FavoritesDialogs.showDeleteFavoriteDialog(tempFavoritesList, removeFavoriteCallback);
    }

    //TODO: Review load and refresh
    _LoadFavorite(favorite) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.loadSelectedSharedVisualization");
        var self = this;

        self._selectedFavorite = favorite;
        
        //TODO: This is better done by changing state before the load!
        self._graph.load(favorite.elements);
        
        //Take filter into account 
        self._graph.filterWIVisualizationGraph();

        //Take collapse into account
        //THIs is tricky, since also nodes that have never been expanded are 
        self._graph.hideCollapsedNodes();    
        
        self._graph.zoomTo100();

        var witviz = WorkitemVisualization.witviz;
        witviz.refreshWorkItemNodes();
    }

    _LoadWorkItemsWithPossition() {

    }

    _RebuildFavoritesMenu() {
        // Get an account-scoped document in a collection
        var self = this;
        self.favoritesMenu = self.getInitialFavoriteMenu();

        self._favoritesList.forEach(function (n) {
            self.favoritesMenu.push({ id: "select-favorit-" + n.name, text: n.name, title: n.name, showText: true });
        });

        self._menu.updateItems(self._createToolbarItems());
    }
    //TODO: Move to separate data service class?    
    _LoadFavoritesFromSettings() {
        // Get an account-scoped document in a collection
        var self = this;
        self.favoritesMenu = self.getInitialFavoriteMenu();

        VSS.getService(VSS.ServiceIds.ExtensionData).then(function (dataService: IExtensionDataService) {
            dataService.getDocument(VSS.getWebContext().project.name, "ProjectShared").then(function (doc) {
                //_favoritesList = docs.filter(function (i) { return i.id == "ProjectShared"; })[0].List;
                TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.loadSharedVisualizationsFromProject", null, { sharedVisualizationCount: doc.List.length });
                self._favoritesList = doc.List;
                self._RebuildFavoritesMenu();
            },
                function (err) {
                    self._RebuildFavoritesMenu();
                });
        });
    }

    private getInitialFavoriteMenu(): string[] {
        var tempFavoritesMenu = [];
        tempFavoritesMenu.push({ id: "favorites-add", text: "Save", title: "Save visualization", showText: true, icon: "bowtie-icon bowtie-math-plus" });
        tempFavoritesMenu.push({ id: "favorites-remove", text: "Remove", title: "Remove saved visualization", showText: true, icon: "bowtie-icon bowtie-edit-delete" });
        tempFavoritesMenu.push({ separator: true });
        return tempFavoritesMenu;
    }
    //menu-item-icon bowtie-icon bowtie-edit-delete

    //TODO: Move to separate data service class?
    _SaveFavoritesToSettings(favoList, scopeType) {

        VSS.getService(VSS.ServiceIds.ExtensionData).then(function (dataService: IExtensionDataService) {
            // Set a user-scoped preference
            dataService.setDocument(VSS.getWebContext().project.name, { id: "ProjectShared", __etag: -1, List: favoList }).then(function (value) {
                console.log("Saved list " + value);
            });
        });

    }

    /*  Handle a button click on the toolbar
    */
    _onToolbarItemClick(sender, args) {
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
            case "favorites-remove":
                this._removeFavorite();
                break;
            case "add-annotation":
                this._addNote();
                break;
            // case "filter":
            //     this._filter();
            //     break;
            default:
                if (command.indexOf("select-favorit-") == 0) {
                    var self = this;
                    self._favoritesList.forEach(function (m) {
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

    _exportGraph() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.exportGraph");

        var self = this;
        if (self.detectIE()) {
            TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.exportGraph.IESecurityError");
            var options = { buttons: null, title: "Can not export in IE", contentText: "Export does not work in IE due to SVG toDataUrl throwing SecurityError. Try Edge, FireFox, Chrome, or other browsers." };
            Dialogs.show(Dialogs.ModalDialog, options);
            return;
        }

        var witType = "";
        var witId = "";
        var png = self._graph.exportImage();
        var rootNodes = self._graph.findBySelector('node').roots();
        if (!rootNodes.empty()) {
            witType = rootNodes[0].data("workItemType");
            witId = rootNodes[0].data("origId");
        }

        // var form = PrintGraph.PrintGraph;
        // form.showPrintGraphForm(png, witType, witId);

        VSS.getService(VSS.ServiceIds.Dialog).then(function (dlg: IHostDialogService) {
            var printGraphDialog;
            var extensionCtx = VSS.getExtensionContext();
            var contributionId = extensionCtx.publisherId + "." + extensionCtx.extensionId + ".work-item-visualization-print-graph-dialog";
            var opts: IHostDialogOptions = {
                width: window.screen.width,
                height: window.screen.height,
                title: "Export Work Item Visualization",
                buttons: null
            };
            //TODO: later make dialog same size as window and offer full screen option
            dlg.openDialog(contributionId, opts).then(function (dialog) {
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
    detectIE(): boolean {
        var ua = window.navigator.userAgent;

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10) != NaN;
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10) != NaN;
        }

        // other browser
        return false;
    }

    _findWorkItem() {
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.showFindWorkItemDialog");

        var self = this;

        var categoryArray = self._graph.getVisibleNodesCategories();

        var form = FindWitDialog.FindWitDialog;
        form.showFindWitForm(categoryArray, function (searchText: string, category: string) {
            TelemetryClient.TelemetryClient.getClient().trackEvent("FindWorkItemDialog.findAndHighlight");
            self._graph.findAndHighlight(searchText, category);
        });
    }

    _toggleLegendPane() {
        var legendPane = $("#legend-pane");

        if (this._splitterPaneOnOff === "on") {
            legendPane.css("display", "none");
            this._splitter.noSplit();
            this._splitterPaneOnOff = "off";
        }
        else {
            this._splitter.horizontal();
            this._splitter.split();
            legendPane.css("display", "block");
            this._splitterPaneOnOff = "on";
        }
    }

    GetLinkType() {
        return this._linkType;
    };

    GetDiagramType() {
        return this._diagramType;
    };

    /*
     *  Enables the toolbar menu items - to be called after the work item diagram is set initially
     */
    EnableToolbar() {
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
}

Controls.Enhancement.registerEnhancement(MainMenu, ".hub-view");

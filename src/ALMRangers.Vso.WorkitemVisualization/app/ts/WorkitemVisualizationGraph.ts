/*---------------------------------------------------------------------
// <copyright file="WorkitemVisualizationGraph.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The logic related to Cytoscape graph api to visualize data.
 //  </summary>
//---------------------------------------------------------------------*/

//TODO: Tooltip support

import * as AnnotationForm from "./AnnotationForm"
import * as TelemetryClient from "./TelemetryClient"
import * as NodeData from "./Node"
import * as Common from "./Common"

declare function unescape(s: string): string;
interface IHostNavigationService { openNewWindow: any; }

export class WorkitemVisualizationGraph {
    private _navigator = null;
    private _container = null;
    private _expandNodeCallback = null;
    private defaultBackgroundColor = "#fff";
    private defaultBorderColor = "#000";
    private defaultTextColor = "#000";
    private graphLoaded = false;
    public direction = 'LR';
    private cy: any;
    private cytoscape: any; // turn into real types once we upgrade cytoscape to be npm package
    private _contextMenus: any;
    private _currentFilter: Common.FilterTypes;
    private _hideCategoryList: Array<string>;
    private _showCategoryList: Array<string>;
    public _nodeCategoriesOnVisualization: Array<string>;
    public _nodeStatesOnVisualization: Array<string>;
    public _nodeWorkItemTypesOnVisualization: Array<string>;

    constructor(container, cytoscape) {
        this._container = container;
        this.direction = 'LR';
        this.cytoscape = cytoscape;
        this.cy = null;

        this._currentFilter = Common.FilterTypes.WorkItemOnly;
        this._hideCategoryList = this.getHideCategories(this._currentFilter);
        this._showCategoryList = this.getShowCategories(this._currentFilter);
        this._nodeCategoriesOnVisualization = new Array<string>();
        this._nodeStatesOnVisualization = new Array<string>();
        this._nodeWorkItemTypesOnVisualization = new Array<string>();
    }


    navigateTo = (url): void => {
        // Get navigation service
        VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: IHostNavigationService) {
            //Check if openNewWindow is available
            if (navigationService.openNewWindow) {
                navigationService.openNewWindow(url, "");
            }
            else//, if not then use old approach (Update 2 and below)
            {
                window.open(url, "_blank");
            }
        });
    }

    xmlSafe = (text): string => {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    public setExpandNodeCallback(callback) {
        this._expandNodeCallback = callback;
    }

    public create(nodes, edges, callback) {
        var self = this;
        self.cytoscape({
            container: self._container[0],
            style: self.cytoscape.stylesheet()
                .selector('node')
                .css({
                    'shape': 'rectangle',
                    'width': '210px',
                    'height': '80px',
                    'background-image': 'data(bgImage)',
                    'background-width': '210px',
                    'background-height': '80px'
                })
                .selector(':selected')
                .css({
                    'border-width': 2,
                    'border-color': '#696969'//d2691e
                })
                .selector("node[category='Annotation']")
                .css({
                    'background-color': 'white'
                })

                .selector("node[size='Medium']")
                .css({
                    'shape': 'rectangle',
                    'width': '300px',
                    'height': '120px',
                    'background-image': 'data(bgImage)',
                    'background-width': '300px',
                    'background-height': '120px'
                })
                .selector("node[size='Large']")
                .css({
                    'shape': 'rectangle',
                    'width': '400px',
                    'height': '160px',
                    'background-image': 'data(bgImage)',
                    'background-width': '400px',
                    'background-height': '160px'
                })

                .selector('edge')
                .css({
                    'source-arrow-shape': 'circle',
                    'target-arrow-shape': 'triangle',
                    'line-color': '#ddd',
                    'target-arrow-color': '#ddd',
                    'content': 'data(name)',
                    'text-opacity': '0.5',
                    'control-point-step-size': 100,
                    'font-size': '14px',
                    'font-family': 'Segoe UI,Tahoma,Arial,Verdana'
                }),
            layout: {
                name: 'dagre',
                rankDir: self.direction,
                minLen: function (edge) { return 4; }
            },
            elements: {
                nodes: nodes,
                edges: edges
            },
            // on graph initial layout done (could be async depending on layout...)
            ready: function () {
                (<any>window).cy = this;
                self.cy = this;
                self.graphLoaded = true;

                self.cy.minZoom(0.1);
                self.cy.maxZoom(5);
                self.cy.userZoomingEnabled(true);
                self.cy.boxSelectionEnabled(true);
                self.cy.zoom(1);

                self.cy.viewUtilities();

                self.cy.on('tap', 'node', function (e) {
                    TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.Tap.Expand");
                    self.expandItem(e);
                });

                callback();

                self._contextMenus = self.cy.contextMenus({
                    menuItems: [
                        {
                            id: 'openInNewWindow', // ID of menu item
                            title: 'open in new tab', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: 'node[category!="Annotation"]', //category: "Annotation",
                            onClickFunction: self.openInNewWindow.bind(self),
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                        {
                            id: 'expandItem', // ID of menu item
                            title: 'expand', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: "node[!expanded][category!='Annotation']",
                            onClickFunction: self.expandItemFromContextMenu.bind(self),
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                        {
                            id: 'collapseItem', // ID of menu item
                            title: 'collapse', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: "node[?expanded][category!='Annotation']",
                            onClickFunction: self.collapseItem.bind(self),
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                        {
                            id: 'editAnnotationNode', // ID of menu item
                            title: 'edit', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: "node[category='Annotation']",
                            onClickFunction: self.openAnnotation.bind(self), //self.editAnnotationNode.bind(self),
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                        {
                            id: 'removeAnnotationNode', // ID of menu item
                            title: 'remove', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: "node[category='Annotation']",
                            onClickFunction: self.removeAnnotationNode.bind(self),
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: false, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                    ]
                });

                $(document).on('contextmenu', function (e) {
                    e.preventDefault();
                });
            }
        });
    }

    expandItemFromContextMenu(e) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ContenxtMenu.Expand");
        this.expandItem(e);
    }

    expandItem(e) {
        e.preventDefault();
        var self = this;
        var expanded = e.cyTarget.data("expanded");

        //Load and add elements if no expanded metadata on the node
        if (expanded === null || expanded === undefined) {
            self._expandNodeCallback(e.cyTarget);
        }
        //Expand if its currently Expanded = false
        else if (expanded === false) {
            var showFilter = self.getCategoryFilter(self._hideCategoryList, false, '@!=');
            e.cyTarget.successors(showFilter).show();
            e.cyTarget.data("expanded", true);
            self.refreshLayout();
        }
    }

    collapseItem(e) {
        e.preventDefault();
        var self = this;
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ContenxtMenu.Collapse");
        var expanded = e.cyTarget.data("expanded");
        //Collapse if its currently Expanded = true
        if (expanded === true) {
            e.cyTarget.successors().hide();
            e.cyTarget.data("expanded", false);
            self.refreshLayout();
        }
    }

    //TODO: Temp, later shouldnt need. Hides nodes that are not expanded and only used for favorites load scenario
    public hideCollapsedNodes() {
        var self = this;
        //Must have expanded defined as data attribute and currently have value false (collapsed) and be visible
        var collapsedNodes = self.getNodes('[expanded][!expanded]');
        collapsedNodes.successors().hide();
        self.refreshLayout();
    }

    openInNewWindow(e) {
        e.preventDefault();
        var self = this;
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ContenxtMenu.OpenInNewWindow");
        var category = e.cyTarget.data("category");
        switch (category) {
            case "Work Item":
                self.openWorkitem(e.cyTarget);
                break;
            case "Changeset":
            case "Commit":
                self.openCheckin(e.cyTarget);
                break;
            case "File":
                self.openFile(e.cyTarget);
                break;
            case "Pull Request":
                self.openPullRequest(e.cyTarget);
                break;
            case "Annotation":
                self.openAnnotation(e);
                break;
        }
    }

    removeAnnotationNode(e: any) {
        e.preventDefault();
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ContextMenu.RemoveAnnotationNode");

        var self = this;
        var incomers = e.cyTarget.incomers();
        e.cyTarget.remove();
        incomers.remove();
    }

    openWorkitem(node) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openWorkItem");

        var id = node.data("origId");
        var vsoContext = VSS.getWebContext();
        var location = vsoContext.host.uri;
        //Check if location ends with "/"
        if (location.substr(-1) !== "/") {
            location += "/";
        }
        location += vsoContext.project.name + "/_workitems?id=" + id + "&triage=true&_a=edit";
        this.navigateTo(location);
    }

    openPullRequest(node) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openPullRequest");

        var id = node.data("origId");
        var repo = node.data("repo")
        var vsoContext = VSS.getWebContext();
        var location = vsoContext.host.uri;
        //Check if location ends with "/"
        if (location.substr(-1) !== "/") {
            location += "/";
        }
        location += vsoContext.project.name + "/_git/" + repo.name + "/pullrequest/" + id;
        this.navigateTo(location);
    }

    openAnnotation(e) {
        
        e.preventDefault();
        var self = this;
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ContextMenu.EditAnnotationNode");

        var node = e.cyTarget;

        var id = node.data("origId");
        var frm = AnnotationForm.AnnotationForm;

        var hiddenCategoriesFilter = self.getCategoryFilter(self.getHideCategories(null), false, '@!=')
        var nodes = self.getNodes("[category @!= 'Annotation']" + hiddenCategoriesFilter);

        frm.showAnnotationForm(this, node.data(), nodes, "Save", "Edit Annotation", function (title, txt, shapeType, size, linkedToId) {
            //let n2 = self.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
            let nodeDataFactory = new NodeData.NodeDataFactory();
            
            if (node.data("title") != title || node.data("content") != txt || node.data("shapeType") != shapeType || node.data("size") != size) {
                let n2 = nodeDataFactory.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
                node.data("title", n2.data.title);
                node.data("content", n2.data.content);
                node.data("size", n2.data.size);
                node.data("shapeType", n2.data.shapeType);
                node.data("bgImage", n2.data.bgImage);
            }
            
            //TODO: updating whole layout may be too much. 
            if (linkedToId && linkedToId != node.data("linkedToId")) {
                node.data("linkedToId", linkedToId);

                var edges = e.cyTarget.connectedEdges(); //should be one
                var newEdge = nodeDataFactory.createNodeEdgeData(node.data("id"), linkedToId, "");
                if (edges.length > 0 && linkedToId != edges[0].data("target")) {
                    //change linked node
                    var edge = edges[0];
                    edge.data("id", newEdge.data.id);
                    edge.data("target", newEdge.data.target); 
                } 
                //Add link
                else if (edges.length == 0){
                    self.addElement(null, newEdge);
                }
            }
            //Dont render everything, just animate new elements.
            self.refreshLayout();
        });
    }

    openCheckin(node) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openCheckin");
        var id = node.data("origId");
        var category = node.data("category");
        var vsoContext = VSS.getWebContext();
        var location = vsoContext.host.uri;

        //Check if location ends with "/"
        if (location.substr(-1) !== "/") {
            location += "/";
        }

        if (category === "Commit") {
            TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openGitCommit");
            location = node.data("url");
        } else {
            TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openTfvcChangeset");
            location += vsoContext.project.name + "/_versionControl/changeset/" + id;
        }

        this.navigateTo(location);
    }
    openFile(node) {
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openFile");
        //BUG: If commit or file is from different project, then it would not go to right location!
        var objectType = node.data("objectType");
        //Full path
        var vsoContext = VSS.getWebContext();
        var location = vsoContext.host.uri;

        //Check if location ends with "/"
        if (location.substr(-1) !== "/") {
            location += "/";
        }

        if (objectType !== "File") {
            TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openGitFile");
            //Need this url combined - http://taavik-devbox:8080/tfs/DevCollection/Scrum.Demo/_git/953e95e1-c6b8-4ce3-8b61-33c3dcbb2485/commit/2829c8597f5731c3dbee625b04d29600018e1c6b
            var repo = node.data("repo");
            var commitId = node.data("commitId");
            var remoteUrl = vsoContext.project.name + "/_git/" + repo + "/commit/" + commitId;
            var path = node.data("path");
            //This means it's a git file
            location += remoteUrl + "?path=" + path + "&_a=contents";
        } else {
            TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.openTfvcFile");
            //It's a tfvc file
            var origId = node.data("origId");
            var changesetId = node.data("changesetId");
            location += vsoContext.project.name + "/_versionControl/changeset/" + changesetId + "?path=" + origId + "&_a=contents";
        }

        this.navigateTo(location);
    }

    findById(id) {
        return this.cy.getElementById(id);
    }

    findBySelector(selector) {
        return this.cy.$(selector);
    }
    //TODO: Define types on parameters
    findByIdAndCategory(id, category) {
        var self = this;

        var filter = '';
        if (category === Common.Categories.WorkItem || category === Common.Categories.Changeset) {
            id = category.substring(0, 1) + id;
            filter = 'node[id = "' + id + '"][category @= "' + category + '"]';
        }
        else if (category === Common.Categories.Commit) {
            id = "G" + id;
            filter = 'node[id @^= "' + id + '"][category @= "' + category + '"]';
        }
        else if (category === Common.Categories.File) {
            filter = 'node[file @*= "' + id + '"][category @= "' + category + '"]';
        }
        //TODO: Use getNodes(filter)
        var matchingElements = self.cy.elements(filter);
        return matchingElements;
    }
    //TODO: Define types
    findAndHighlight(id, category) {
        var self = this;

        var matchingElements = self.findByIdAndCategory(id, category);

        self.cy.elements(":selected").unselect();
        matchingElements.select();
        return matchingElements;
    }

    public getHideCategories(newFilterValue: Common.FilterTypes): Array<string> {
        var hideCategoryList = new Array<string>();

        if (!newFilterValue && newFilterValue != Common.FilterTypes.All)
            newFilterValue = this._currentFilter;

        //Show all nodes
        if (newFilterValue == Common.FilterTypes.All) {
            return hideCategoryList;
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemOnly) {
            hideCategoryList.push(Common.Categories.Changeset);
            hideCategoryList.push(Common.Categories.Commit);
            hideCategoryList.push(Common.Categories.File);
            hideCategoryList.push(Common.Categories.PullRequest);
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemWithChanges) {
            hideCategoryList.push(Common.Categories.File);
            hideCategoryList.push(Common.Categories.PullRequest);
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemWithChangesAndFiles) {
            hideCategoryList.push(Common.Categories.PullRequest);
        }
        return hideCategoryList;
    }

    public getShowCategories(newFilterValue: Common.FilterTypes): Array<string> {
        var showCategoryList = new Array<string>();
        if (!newFilterValue && newFilterValue != Common.FilterTypes.All)
            newFilterValue = this._currentFilter;
        //Show all nodes
        if (newFilterValue == Common.FilterTypes.All) {
            showCategoryList.push(Common.Categories.PullRequest);
            showCategoryList.push(Common.Categories.Annotation);
            showCategoryList.push(Common.Categories.WorkItem);
            showCategoryList.push(Common.Categories.Changeset);
            showCategoryList.push(Common.Categories.Commit);
            showCategoryList.push(Common.Categories.File);
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemOnly) {
            showCategoryList.push(Common.Categories.Annotation);
            showCategoryList.push(Common.Categories.WorkItem);
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemWithChanges) {
            showCategoryList.push(Common.Categories.Annotation);
            showCategoryList.push(Common.Categories.WorkItem);
            showCategoryList.push(Common.Categories.Changeset);
            showCategoryList.push(Common.Categories.Commit);
        }
        else if (newFilterValue == Common.FilterTypes.WorkItemWithChangesAndFiles) {
            showCategoryList.push(Common.Categories.Annotation);
            showCategoryList.push(Common.Categories.WorkItem);
            showCategoryList.push(Common.Categories.Changeset);
            showCategoryList.push(Common.Categories.Commit);
            showCategoryList.push(Common.Categories.File);
        }
        return showCategoryList;
    }

    public getCategoryFilter(categoryList: Array<string>, useOr: boolean, comparisonOperator: string) {
        var filter = '';
        //default comparisonOperator is used when nothing is supplied
        if (!comparisonOperator) {
            //case insensitive data attribute comparison
            comparisonOperator = "@=";
        }
        for (var i = 0; i < categoryList.length; i++) {
            //This will look something like [category @= "Work Item"]
            filter += '[category ' + comparisonOperator + ' "' + categoryList[i] + '"]';
            if (useOr && i != categoryList.length - 1)
                filter += ',';
        }
        return filter;
    }

    public filterWIVisualizationGraph() {
        var self = this;
        self.changeFilter(self._currentFilter);
    }

    public changeFilter(newFilterValue: Common.FilterTypes) {
        var self = this;

        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ChangedFilter");
        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.ChangeFilterTo:" + Common.FilterTypes[newFilterValue]);

        //TODO: Separate out the logic to get the current show / hide category lists
        var hideCategoryList = self.getHideCategories(newFilterValue);
        var showCategoryList = self.getShowCategories(newFilterValue);

        //store state on graph
        self._currentFilter = newFilterValue;
        self._hideCategoryList = hideCategoryList;
        self._showCategoryList = showCategoryList;

        //Show all nodes
        if (newFilterValue == Common.FilterTypes.All) {
            //Currently hidden elements, show
            self.cy.elements(":hidden").show();
            self.refreshLayout();
            return;
        }

        //var hideFilter = 'node[:visible]'; style: display : element / none
        var hideFilter = self.getCategoryFilter(hideCategoryList, true, null);
        //var showFilter = 'node[:hidden]'; style: display : element / none
        var showFilter = self.getCategoryFilter(showCategoryList, true, null);

        self.cy.elements(showFilter).show();
        self.cy.elements(hideFilter).hide();
        self.refreshLayout();
    }

    public getVisibleNodesCategories(): Array<string> {
        var self = this;

        var isVisible = function (value: string, index: number) {
            return self._showCategoryList.indexOf(value) > -1;
        };
        var result = self._nodeCategoriesOnVisualization.filter(isVisible);
        return result;
    }

    public getVisibleNodesStates(): Array<string> {
        //TODO: known bug by design, wont check if node is visible or not. Just showing the list that is maintained by add.
        //It should be additionally maintained by show / hide
        var self = this;

        return self._nodeStatesOnVisualization;
    }

    public getVisibleNodesWorkItemTypes(): Array<string> {
        //TODO: known bug by design, wont check if node is visible or not. Just showing the list that is maintained by add.
        //It should be additionally maintained by show / hide
        var self = this;

        return self._nodeWorkItemTypesOnVisualization;
    }

    fitTo() {
        this.cy.fit();
    }

    zoomIn() {
        var currentZoom = this.cy.zoom();
        this.cy.zoom(currentZoom + 0.1);
    }

    zoomOut() {
        var currentZoom = this.cy.zoom();
        this.cy.zoom(currentZoom - 0.1);
    }

    zoomTo100() {
        this.cy.zoom(1);
    }

    toggleMinimap() {

        var self = this;
        if (self._navigator === null) {
            //initialize
            this._navigator = this.cy.navigator({
                //self._navigator = self._container.cytoscapeNavigator({
                // options go here
                container: $('#cytoscape-navigator')
            });
        }
        var ele = $("#cytoscape-navigator");
        if (ele.hasClass("visible")) {
            //Hide it
            ele.css("display", "none");
            ele.removeClass("visible");
        }
        else {
            //Show it
            ele.css("display", "block");
            ele.addClass("visible");
        }
    }

    resetMinimap() {
        if (this._navigator != null) {
            this._navigator.destroy();
            this._navigator = null;
            var ele = $("#cytoscape-navigator");

            ele.css("display", "none");
            ele.removeClass("visible");
        }
    }

    getAllNodes() {
        return this.cy.nodes();
    }


    getNodes(filter:string) {
        return this.cy.nodes(filter);
    }

    isGraphLoaded() {
        return this.graphLoaded;
    }

    addElement(node, edge) {
        var nodes = new Array();
        var edges = new Array();
        if (node)
            nodes.push(node);
        if (edge)
            edges.push(edge);
        return this.addElements(nodes, edges);
    }
    //TODO: define correct NodeData types here and cast?
    addElements(nodes, edges) {
        var self = this;
        var newElements = self.cy.collection();
        var elements = new Array();

        for (var i = 0; i < nodes.length; i++) {
            var node = self.cy.getElementById(nodes[i].data.origId);
            //Node is not on visualization yet, so put it into list to add
            if (node.empty()) {
                //if the category should be hidden, then hide it
                if (self._hideCategoryList.indexOf(nodes[i].data.category) > -1) {
                    nodes[i].style.display = 'none';
                }
                //maintain a list of categories for nodes that are on visualization. So if its not in list, yet - then add the category.
                //Saves to have to loop through all nodes to find categories.
                if (self._nodeCategoriesOnVisualization.indexOf(nodes[i].data.category) == -1) {
                    self._nodeCategoriesOnVisualization.push(nodes[i].data.category);
                }
                //maintain a list of states for nodes that are on visualization (only work items). So if its not in list, yet - then add the state.
                //Saves to have to loop through all nodes to find states.
                if (nodes[i].data.state && self._nodeStatesOnVisualization.indexOf(nodes[i].data.state) == -1) {
                    self._nodeStatesOnVisualization.push(nodes[i].data.state);
                }
                //maintain a list of work item types for nodes that are on visualization. So if its not in list, yet - then add the work item types.
                //Saves to have to loop through all nodes to find work item types.
                if (nodes[i].data.workItemType && self._nodeWorkItemTypesOnVisualization.indexOf(nodes[i].data.workItemType) == -1) {
                    self._nodeWorkItemTypesOnVisualization.push(nodes[i].data.workItemType);
                }
                elements.push(nodes[i]);
            }
        }

        for (var j = 0; j < edges.length; j++) {
            //We have to search through all of the existing links to see if the from/to exists
            //but also if the reverse to/from exists by flipping the from and to. In other words if you have a related ink
            //from 1 to 2 then you also have to check for from 2 to 1.
            //Because we can't find a link directly, we have to get the node at each end of the link and check to see if there
            //is a link from that node to the target node or vice versa. At this point, the nodes on both sides of the links
            var source = edges[j].data.source;
            var target = edges[j].data.target;
            var edgeId = edges[j].data.id;
            var reverseEdgeId = target + "-" + source;
            var tmpEdges = self.cy.edges("[id='" + edgeId + "']");//self.cy.edges("#" + edgeId);
            if (tmpEdges.empty()) {
                //This one excludes reverse relation, but now we are including them.
                //#identifier selector doesnt seem to always work
                tmpEdges = self.cy.edges("[id='" + reverseEdgeId + "']");//self.cy.edges("#" + reverseEdgeId);
                if (tmpEdges.empty()) {
                    elements.push(edges[j]);
                }
            }
        }

        if (elements.length > 0) {
            newElements = self.cy.add(elements);
            //self.zoomTo100(); - Test auto-zoom on expand or collapse
            self.refreshLayout();
        }
        return newElements;
    }

    refreshLayout() {
        var self = this;
        self.cy.layout(
            {
                name: 'dagre',
                rankDir: self.direction,
                minLen: function (edge) { return 3; },
                fit: false,
                animate: true,
                animationDuration: 500,
                stop: function () { self.cy.resize(); }
            });
    }

    load(elements) {
        this.cy.load(elements);
    }

    json() {
        return this.cy.json();
    }

    exportImage() {
        //TODO: ISSUE WITH CORS in IE
        var self = this;
        var png64 = self.cy.png({ full: true });
        return png64;
    }
}

export let graph = new WorkitemVisualizationGraph($("#cy"), cytoscape);
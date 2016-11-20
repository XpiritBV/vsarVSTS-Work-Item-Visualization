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

declare function unescape(s:string): string;
interface IHostNavigationService { openNewWindow : any; }

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
    private _contextMenus : any;

    constructor(container, cytoscape) {
        this._container = container;
        this.direction = 'LR';
        this.cytoscape = cytoscape;
        this.cy = null;
    }


    navigateTo = (url): void => {
        // Get navigation service
        VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService : IHostNavigationService) {
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

    setExpandNodeCallback(callback) {
        this._expandNodeCallback = callback;
    }

    create(nodes, edges, callback) {
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
                self.cy.userZoomingEnabled(false);
                self.cy.zoom(1);

                self.cy.viewUtilities();

                var expandItem = function(e)
                {
                    e.preventDefault();

                    var expanded = e.cyTarget.data("expanded");

                    //Load and add elements if no expanded metadata on the node
                    if (expanded === null || expanded === undefined)
                    {
                        self._expandNodeCallback(e.cyTarget);
                    }
                    //Expand if its currently Expanded = false
                    else if (expanded === false)
                    {
                        e.cyTarget.successors().showEles();
                        e.cyTarget.data("expanded", true);
                        self.refreshLayout();
                    }
                }

                var collapseItem = function(e)
                {
                    e.preventDefault();

                    var expanded = e.cyTarget.data("expanded");
                    //Collapse if its currently Expanded = true
                    if (expanded === true) {
                        e.cyTarget.successors().hideEles();
                        e.cyTarget.data("expanded", false);
                        self.refreshLayout();
                    }
                }

                self.cy.on('tap', 'node', function (e) {
                    expandItem(e);
                });

                callback();

                var onRightClick = function (e) {
                    e.preventDefault();

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
                            self.openAnnotation(e.cyTarget);
                            break;
                    }
                }

                this._contextMenus = self.cy.contextMenus({
                    menuItems: [
                        {
                            id: 'openInNewWindow', // ID of menu item
                            title: 'open in new tab', // Title of menu item
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: 'node[category!="Annotation"]', //category: "Annotation",
                            onClickFunction: onRightClick,
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
                            onClickFunction: expandItem,
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
                            onClickFunction: collapseItem,
                            disabled: false, // Whether the item will be created as disabled
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
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

    openAnnotation(node) {
        var self = this;

        var id = node.data("origId");
        var frm = AnnotationForm.AnnotationForm;

        frm.showAnnotationForm(this, node.data(), this.getAllNodes(), function (title, txt, shapeType, size, linkedToId) {
            //let n2 = self.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
            let nodeDataFactory = new NodeData.NodeDataFactory();
            let n2 = nodeDataFactory.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
            node.data("title", n2.data.title);
            node.data("content", n2.data.content);
            node.data("linkedToId", n2.data.linkedToId);
            node.data("shapeType", n2.data.shapeType);
            node.data("bgImage", n2.data.bgImage);

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

    findAndHighlight(id, category) {
        var self = this;

        var filter = '';
        if (category === "Work Item" || category === "Changeset") {
            id = category.substring(0, 1) + id;
            filter = 'node[id = "' + id + '"][category @= "' + category + '"]';
        }
        else if (category === "Commit") {
            id = "G" + id;
            filter = 'node[id @^= "' + id + '"][category @= "' + category + '"]';
        }
        else if (category === "File") {
            filter = 'node[file @*= "' + id + '"][category @= "' + category + '"]';
        }

        var matchingElements = self.cy.elements(filter);
        self.cy.elements(":selected").unselect();
        matchingElements.select();
        return matchingElements;
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
        if (this._navigator === null) {
            //initialize
            this._navigator = this.cy.navigator({ 
                //this._container.cytoscapeNavigator({
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


    getNodes(filter) {
        return this.cy.nodes(filter);
    }

    isGraphLoaded() {
        return this.graphLoaded;
    }

    addElement(node, edge) {
        var nodes = new Array();
        var edges = new Array();
        nodes.push(node);
        edges.push(edge);
        return this.addElements(nodes, edges);
    }

    addElements(nodes, edges) {
        var self = this;
        var newElements = self.cy.collection();
        var elements = new Array();


        for (var i = 0; i < nodes.length; i++) {
            var node = self.cy.getElementById(nodes[i].data.origId);
            if (node.empty()) {
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
                minLen: function (edge) { return 4; },
                fit: false,
                animate: true,
                animationDuration: 500,
                stop: function () { self.cy.resize(); }
            });
    }

    load(elements)
    {
        this.cy.load(elements);
    }

    json()
    {
        return this.cy.json();
    }

    exportImage() {
        //TODO: ISSUE WITH CORS in IE
        var self = this;
        var png64 = self.cy.png({ full: true });
        return png64;
    }
}

export let graph =  new WorkitemVisualizationGraph($("#cy"), cytoscape);
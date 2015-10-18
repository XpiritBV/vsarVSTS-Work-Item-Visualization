/*---------------------------------------------------------------------
// <copyright file="StateModelVisualization.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The main application flow and logic.
 //  </summary>
//---------------------------------------------------------------------*/

//TODO: Tooltip support
//TODO: Highlight node
//TODO: Highlight background, border
//TODO: Context Menu on right click

define(["require", "exports"], function (require, exports) {
    var WorkitemVisualizationGraph = (function() {
        
        var _navigator = null;
        var _container = null;
        var _expandNodeCallback = null;

        function WorkitemVisualizationGraph(container, cytoscape) {
            var self = this;
            _container = container;
            self.direction = 'LR';
            self.cy = null;
            self.cytoscape = cytoscape;
        }

        WorkitemVisualizationGraph.prototype.setExpandNodeCallback = function (callback) {
            var self = this;
            _expandNodeCallback = callback;
        }

        WorkitemVisualizationGraph.prototype.create = function (nodes, edges, callback) {
            var self = this;
            //_container.cytoscape({
            self.cytoscape({
                container: _container[0],
                style: self.cytoscape.stylesheet()
                    .selector('node')
                    .css({
                        'shape': 'rectangle',
                        'width': '200px',
                        'height': '80px',
                        'content': 'data(content)',
                        'text-valign': 'center',
                        'color': 'black',
                        'background-image': 'data(bgImage)',
                        'background-width': '200px',
                        'background-height': '80px',
                        //'background-image': "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200px' height='75px'%3E%3Crect x='0' y='0' width='200px' height='75px' fill='white' stroke='black'%3E%3C/rect%3E%3Crect width='15px' height='75px' fill='blue' x='0' y='0'%3E%3C/rect%3E%3C/svg%3E",
                        'text-wrap': 'wrap',
                        'font-family': 'Segoe UI,Tahoma,Arial,Verdana',
                        'font-size': '12px'
                    })
                    .selector('edge')
                    .css({
                        'source-arrow-shape': 'circle',
                        'target-arrow-shape': 'triangle',
                        'line-color': '#ddd',
                        'target-arrow-color': '#ddd',
                        'content': 'data(name)',
                        'text-opacity': '0.5',
                        'control-point-step-size': 100
                        //'curve-style': 'haystack'
                    }),
                layout: {
                    name: 'dagre',
                    rankDir: self.direction,
                    minLen: function (edge) { return 5; }
                    //animate: true, // whether to transition the node positions
                    //animationDuration: 500 // duration of animation in ms if enabled
                },
                elements: {
                    nodes: nodes,
                    edges: edges
                },
                // on graph initial layout done (could be async depending on layout...)
                ready: function () {
                    window.cy = this;
                    self.cy = this;

                    self.cy.minZoom(0.1);
                    self.cy.maxZoom(5);
                    //self.cy.elements().unselectify();
                    self.cy.userZoomingEnabled(false);
                    self.cy.boxSelectionEnabled(true);
                    self.cy.zoom(0.8);

                    //TODO: unbinding necessary when graph is recreated
                    self.cy.on('tap', 'node', function (e) {
                        e.preventDefault();

                        var expanded = e.cyTarget.data("expanded");
                        if (expanded === null || expanded === undefined || expanded !== true) {
                            _expandNodeCallback(e.cyTarget);
                        }
                        
                        //alert('left click node' + e.cyTarget.id());
                    });

                    callback();
                    cy.on('cxttap', 'node', function (e) {
                    //cy.$('node').one('cxttap', function(e) {
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
                        }
                        //alert('right click node' + e.cyTarget.id());
                    });

                    //cy.on('mouseover', 'node', function (e) {
                    //cy.$('node').one('mouseover', function (e) {
                    //    e.preventDefault(); 
                    //    if (e.cyTarget.data("category") === "Work Item") {
                    //        var text = e.cyTarget.data("title");
                    //        var renderedPosition = e.cyTarget.renderedPosition();
                    //        var height = e.cyTarget.height();
                    //        var newX = renderedPosition.x + (height / 2);
                    //        var newY = renderedPosition.y;
                    //        $("#witViz-tooltip").css({"position": "relative", "top": newX + "px", "left": newY +"px" });
                    //        $("#witViz-tooltip").text(text).show();
                    //    }
                        
                    //});

                    //////cy.on('mouseout', 'node', function (e) {
                    //cy.$('node').one('mouseout', function (e) {
                    //    e.preventDefault();
                    //    $("#witViz-tooltip").hide();
                    //});


                    $(document).on('contextmenu', function (e) {
                        e.preventDefault();
                    });
                }
            });
        }

        WorkitemVisualizationGraph.prototype.openWorkitem = function (node) {
            var id = node.data("origId");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri + "/" + vsoContext.project.name + "/_workitems#id=" + id + "&triage=true&_a=edit";
            window.open(location, "_blank");
        }

        WorkitemVisualizationGraph.prototype.openCheckin = function (node) {
            var id = node.data("origId");
            var category = node.data("category");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri;

            if (category === "Commit") {
                //TODO: Cant we use and store the remote url of commit?
                location += "/_git/" + vsoContext.project.name + "/commit/" + id;
            } else {
                //TODO: Cant we use and store the remote url of changeset - if exists?
                location += "/" + vsoContext.project.name + "/_versionControl/changeset/" + id;
            }

            window.open(location, "_blank");
        }
        WorkitemVisualizationGraph.prototype.openFile = function (node) {
            var objectType = node.data("objectType");
            //Full path
            //https://jeff.visualstudio.com/DefaultCollection/_git/PersonSearch/commit/8ed5b88cc494dadab411ad37fb597f54f4da6ecf#path=%2FMyPeopleSearch%2FViews%2FDetailPage.xaml&_a=contents
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri;

            if (objectType !== "File") {
                var path = node.data("path");
                var commitId = node.data("commitId");
                //This means it's a git file
                //TODO: Cant we use and store the remote url of commit?
                location += "/_git/" + vsoContext.project.name + "/commit/" + commitId + "#path=" + path + "&_a=contents";
            } else {
                //TODO: Cant we use and store the remote url of changeset - if exists?
                //It's a tfvc file
                var origId = node.data("origId");
                var changesetId = node.data("changesetId");
                //https://jeff.visualstudio.com/DefaultCollection/WorkItemVisualizations/_versionControl/changeset/84#path=%24%2FWorkItemVisualizations%2FConsoleApplication1%2FConsoleApplication1%2FMyNewClass.cs&_a=contents
                location += "/" + vsoContext.project.name + "/_versionControl/changeset/" + changesetId + "#path=" + origId + "&_a=contents";
            }

            window.open(location, "_blank");
        }

        WorkitemVisualizationGraph.prototype.findById = function(id) {
            return this.cy.getElementById(id);
        }

        WorkitemVisualizationGraph.prototype.fitTo = function() {
            this.cy.fit();
        }

        WorkitemVisualizationGraph.prototype.zoomIn = function() {
            var currentZoom = this.cy.zoom();
            this.cy.zoom(currentZoom + 0.1);
        }

        WorkitemVisualizationGraph.prototype.zoomOut = function() {
            var currentZoom = this.cy.zoom();
            this.cy.zoom(currentZoom - 0.1);
        }

        WorkitemVisualizationGraph.prototype.zoomTo100 = function() {
            this.cy.zoom(1);
        }

        WorkitemVisualizationGraph.prototype.toggleMinimap = function() {
            var self = this;
            if (_navigator === null) {
                //initialize
                _navigator = _container.cytoscapeNavigator({
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

        WorkitemVisualizationGraph.prototype.resetMinimap = function () {
            if (_navigator != null) {
                _navigator.destroy();
                _navigator = null;
                var ele = $("#cytoscape-navigator");

                ele.css("display", "none");
                ele.removeClass("visible");
            }
        }

        WorkitemVisualizationGraph.prototype.createWitNodeData = function (wit) {
            var assigned = "";
            if (wit.fields["System.AssignedTo"] != null) {
                assigned = wit.fields["System.AssignedTo"].replace(/<.*>/i, " ");
            }
            var witState = wit.fields["System.State"];
            var witType = wit.fields["System.WorkItemType"];
            var title = wit.fields["System.Title"];
            var partialTitle = title.substring(0, title.length > 20 ? 20 : title.length);
            //TODO: cap the length, combine the title thing
            var content = witType + "\n" + wit.id + " " + partialTitle + "\n" + witState;
            var newNode = {
                id: "W" + wit.id,
                origId: wit.id,
                category: "Work Item",
                content: content,
                title: title,
                state: witState,
                workItemType: witType,
                bgImage: this.getNodeBackgroundImage(witType ),
                assignedTo: assigned
            };
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createChangesetNodeData = function (cs) {
            var d = new Date(cs.createdDate);
            //TODO: cap the length, combine the title thing
            var content = "Changeset" + "\n" + id + " " + d.toLocaleString() + "\n" + cs.author.displayName;
            var newNode = {
                id: "C" + id,
                origId: id,
                category: "Changeset",
                content: content,
                bgImage: this.getNodeBackgroundImage("Changeset"),
                author: cs.author.displayName,
                createdDate: d.toLocaleString(),
                comment: cs.comment
            }
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createCommitNodeData = function (commit, repo) {
            var d = new Date(commit.author.date);
            //TODO: cap the length, combine the title thing
            var content = "Commit" + "\n" + commit.commitId.substring(0, 6) + "..." + d.toLocaleString() + "\n" + commit.author.name;
            var newNode = {
                id: "G" + commit.commitId,
                origId: commit.commitId,
                repo: repo,
                category: "Commit",
                content: content,
                shortId: commit.commitId.substring(0, 6) + "...",
                bgImage: this.getNodeBackgroundImage("Changeset"),
                author: commit.author.name,
                createdDate: d.toLocaleString(),
                comment: commit.comment
            }
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createFileNodeData = function (change, changesetId) {
            //TODO: cap the length, combine the title thing
            //TODO: NOT HANGLING FOLDERS!
            var find = '/';
            var re = new RegExp(find, 'g');
            var fileKey = "F" + change.item.path.replace(find,"");
            //Create the node
            var content = "File" + "\n" + change.item.path.substring(change.item.path.lastIndexOf('/') + 1) + "\n" + changesetId;
            var newNode = {
                id: fileKey,
                origId: change.item.path,
                changesetId: changesetId,
                category: "File",
                objectType: "File",
                file: change.item.path.substring(change.item.path.lastIndexOf('/') + 1),
                changeType: change.changeType,
                bgImage: this.getNodeBackgroundImage("File"),
                content: content
            };

            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createCommitFileNodeData = function (change, data) {
            //TODO: cap the length, combine the title thing
            //TODO: NOT HANGLING FOLDERS!
            var find = '/';
            var re = new RegExp(find, 'g');
            var fileKey = "F" + change.item.path.replace(re, "");
            var content = "File" + "\n" + change.item.path.substring(change.item.path.lastIndexOf('/') + 1) + "\n" + data.id.substring(0, 18) + "...";
            //Create the node
            var newNode = {
                id: fileKey,
                origId: change.item.url,
                repo: data.repo,
                commitId: data.id,
                category: "File",
                objectType: change.item.gitObjectType,
                file: change.item.path.substring(change.item.path.lastIndexOf('/') + 1),
                path: change.item.path,
                changeType: change.changeType,
                bgImage: this.getNodeBackgroundImage("File"),
                content: content
            };

            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createNodeEdgeData = function(source, target, name) {
            return {
                group: 'edges',
                data: {
                    id: source+"-"+target,
                    source: source,
                    target: target,
                    name: name
                }
            };
        }

        WorkitemVisualizationGraph.prototype.addElement = function (node, edge) {
            var nodes = new Array();
            var edges = new Array();
            nodes.push(node);
            edges.push(edge);
            this.addElements(nodes, edges);
        }

        WorkitemVisualizationGraph.prototype.addElements = function (nodes, edges) {
            var elements = new Array();
            var self = this;

            for (var i = 0; i < nodes.length; i++) {
                var node = self.cy.getElementById(nodes[i].data.origId);
                if (node.empty()) {
                    //self.cy.add(node);
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
                var tmpEdges = self.cy.edges("#" + edgeId);
                if (tmpEdges.empty()) {
                    tmpEdges = self.cy.edges("#" + reverseEdgeId);
                    if (tmpEdges.empty()) {
                        //self.cy.add(edge);
                        elements.push(edges[j]);
                    }
                }
            }
            
            if (elements.length > 0) {
                self.cy.add(elements);
                self.refreshLayout();
            }
        }

        WorkitemVisualizationGraph.prototype.refreshLayout = function () {
            var self = this;
            self.cy.layout(
                    {
                        name: 'dagre',
                        rankDir: self.direction,
                        minLen: function (edge) { return 5; },
                        fit: false,
                        animate: true,
                        animationDuration: 500,
                        stop: function () { self.cy.resize();  }
                    });
        }

        WorkitemVisualizationGraph.prototype.exportImage = function () {
            //TODO: ISSUE WITH CORS
            var self = this;
            var png64 = self.cy.png({ full: true });
            return png64;
        }

        WorkitemVisualizationGraph.prototype.getNodeBackgroundImage = function (type) {
            //TODO: Generate the SVG data in XML and based on profile colors in the future
            var bgImage = "data:image/svg+xml;base64,";//"url(/images/svg/";
            switch (type) {
                case "Product Backlog Item":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjMDA5Q0NDIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Task":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjRjJDQjFEIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Test Case":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjRkZBNTAwIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Bug":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjQ0MyOTNEIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Impediment":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjRkY5RDAwIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Feature":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjNzczQjkzIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Test Suite":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjRkY5RDAwIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Test Plan":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjRkY5RDAwIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "Changeset":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
                    break;
                case "File":
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSJvbGl2ZSIgZD0iTTAgMGgxMHY4MEgweiIvPjwvc3ZnPg==";
                    break;
                default:
                    bgImage += "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTAgMGgyMDB2ODBIMHoiLz48cGF0aCBmaWxsPSIjQ0MyOTNEIiBkPSJNMCAwaDEwdjgwSDB6Ii8+PC9zdmc+";
            }

            return bgImage;
        }
        return WorkitemVisualizationGraph;
    })();
    exports.graph = new WorkitemVisualizationGraph($("#cy"), cytoscape);
});
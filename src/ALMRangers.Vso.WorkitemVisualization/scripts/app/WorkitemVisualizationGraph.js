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
 //     ALM Rangers. The logic related to Cytoscape graph api to visualize data.
 //  </summary>
//---------------------------------------------------------------------*/

//TODO: Tooltip support
//TODO: Context Menu on right click

define(["require", "exports", "Scripts/app/TeleMetryClient"], function (require, exports, TelemetryClient) {
    var WorkitemVisualizationGraph = (function() {
        
        var _navigator = null;
        var _container = null;
        var _expandNodeCallback = null;
        var defaultBackgroundColor = "#fff";
        var defaultBorderColor = "#000";
        var defaultTextColor = "#000";
        var graphLoaded = false;

        function navigateTo(url)
        {
            // Get navigation service
            VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService) {
                //Check if openNewWindow is available
                if (navigationService.openNewWindow)
                {
                    navigationService.openNewWindow(url, "");
                }
                else//, if not then use old approach (Update 2 and below)
                {
                    window.open(url, "_blank");
                }
            });
        }

        function xmlSafe(text)
        {
            return  text.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;');
        }

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
            self.cytoscape({
                container: _container[0],
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
                    window.cy = this;
                    self.cy = this;
                    graphLoaded = true;

                    self.cy.minZoom(0.1);
                    self.cy.maxZoom(5);
                    self.cy.userZoomingEnabled(false);
                    self.cy.zoom(1);

                    self.cy.on('tap', 'node', function (e) {
                        e.preventDefault();

                        var expanded = e.cyTarget.data("expanded");
                        if (expanded === null || expanded === undefined || expanded !== true) {
                            _expandNodeCallback(e.cyTarget);
                        }
                    });

                    callback();

                    var onRightClick = function(e) {
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
                    }

                    self.cy.on('cxttap', 'node', function (e) {
                        onRightClick(e);
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
            TelemetryClient.getClient().trackEvent("openWorkItem");

            var id = node.data("origId");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri;
            //Check if location ends with "/"
            if (location.substr(-1) !== "/") {
                location += "/";
            }
            location += vsoContext.project.name + "/_workitems?id=" + id + "&triage=true&_a=edit";
            navigateTo(location);
        }

        WorkitemVisualizationGraph.prototype.openCheckin = function (node) {
            TelemetryClient.getClient().trackEvent("openCheckin");
            var id = node.data("origId");
            var category = node.data("category");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri;

            //Check if location ends with "/"
            if (location.substr(-1) !== "/") {
                location += "/";
            }

            if (category === "Commit") {
                location = node.data("url");
            } else {
                location += vsoContext.project.name + "/_versionControl/changeset/" + id;
            }

            navigateTo(location);
        }
        WorkitemVisualizationGraph.prototype.openFile = function (node) {
            TelemetryClient.getClient().trackEvent("openFile");
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
                var remoteUrl = node.data("url");
                var path = node.data("path");
                //This means it's a git file
                location = remoteUrl + "?path=" + path + "&_a=contents";
            } else {
                //It's a tfvc file
                var origId = node.data("origId");
                var changesetId = node.data("changesetId");
                location += vsoContext.project.name + "/_versionControl/changeset/" + changesetId + "?path=" + origId + "&_a=contents";
            }

            navigateTo(location);
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

        WorkitemVisualizationGraph.prototype.toggleMinimap = function () {

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

        WorkitemVisualizationGraph.prototype.getAllNodes = function () {
            return this.cy.nodes();
        }

        WorkitemVisualizationGraph.prototype.isGraphLoaded = function () {
            return graphLoaded;
        }

        WorkitemVisualizationGraph.prototype.createWitNodeData = function (wit) {
            var assigned = "";
            if (wit.fields["System.AssignedTo"] != null) {
                assigned = wit.fields["System.AssignedTo"].replace(/<.*>/i, " ");
            }
            var witState = wit.fields["System.State"];
            var witType = wit.fields["System.WorkItemType"];
            var title = wit.fields["System.Title"];
            var witText = this.getWitText(wit.id, title, witState, witType, assigned);
            var newNode = {
                id: "W" + wit.id,
                origId: wit.id,
                category: "Work Item",
                content: witText,
                title: title,
                state: witState,
                workItemType: witType,
                bgImage: this.getWitBackground(witType, witText),
                assignedTo: assigned,
                url: wit.url
            };
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createChangesetNodeData = function (cs) {
            var category = "Changeset";
            var d = new Date(cs.createdDate);
            var cardText = this.getArtifactText(category, cs.changesetId, d.toLocaleString(), cs.author.displayName);
            var newNode = {
                id: "C" + cs.changesetId,
                origId: cs.changesetId,
                category: category,
                content: cardText,
                bgImage: this.getArtifactBackground(category, cardText),
                author: cs.author.displayName,
                createdDate: d.toLocaleString(),
                comment: cs.comment,
                url: cs.url
            }
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createCommitNodeData = function (commit, repo) {
            var category = "Commit";
            var d = new Date(commit.author.date);
            var cardText = this.getArtifactText(category, commit.commitId, d.toLocaleString(), commit.author.name);
            var newNode = {
                id: "G" + commit.commitId,
                origId: commit.commitId,
                repo: repo,
                category: category,
                content: cardText,
                shortId: commit.commitId.substring(0, 6) + "...",
                bgImage: this.getArtifactBackground(category, cardText),
                author: commit.author.name,
                createdDate: d.toLocaleString(),
                comment: commit.comment,
                url : commit.remoteUrl
            }
            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createFileNodeData = function (change, changesetId) {
            var category = "File";
            var fileName = change.item.path.substring(change.item.path.lastIndexOf('/') + 1);
            var find = '[/$]';
            var re = new RegExp(find, 'g');
            var fileKey = "F" + change.item.path.replace(re,"");
            //Create the node
            var cardText = this.getArtifactText(category, fileName, change.changeType, "");
            var newNode = {
                id: fileKey,
                origId: change.item.path,
                changesetId: changesetId,
                category: category,
                objectType: "File",
                file: fileName,
                changeType: change.changeType,
                bgImage: this.getArtifactBackground(category, cardText),
                content: cardText
            };

            return { group: 'nodes', data: newNode };
        }

        WorkitemVisualizationGraph.prototype.createCommitFileNodeData = function (change, data) {
            var category = "File";
            var fileName = change.item.path.substring(change.item.path.lastIndexOf('/') + 1);
            var find = '[/$]';
            var re = new RegExp(find, 'g');
            var fileKey = "F" + change.item.path.replace(re, "");
            var cardText = this.getArtifactText(category, fileName, change.changeType, "");
            //Create the node
            var newNode = {
                id: fileKey,
                origId: change.item.url,
                repo: data.repo,
                commitId: data.id,
                category: category,
                objectType: change.item.gitObjectType,
                file: fileName,
                path: change.item.path,
                changeType: change.changeType,
                bgImage: this.getArtifactBackground(category, cardText),
                content: cardText
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
            return this.addElements(nodes, edges);
        }

        WorkitemVisualizationGraph.prototype.addElements = function (nodes, edges) {
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
                var tmpEdges = self.cy.edges("#" + edgeId);
                if (tmpEdges.empty()) {
                    tmpEdges = self.cy.edges("#" + reverseEdgeId);
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

        WorkitemVisualizationGraph.prototype.refreshLayout = function () {
            var self = this;
            self.cy.layout(
                    {
                        name: 'dagre',
                        rankDir: self.direction,
                        minLen: function (edge) { return 4; },
                        fit: false,
                        animate: true,
                        animationDuration: 500,
                        stop: function () { self.cy.resize();  }
                    });
        }

        WorkitemVisualizationGraph.prototype.exportImage = function () {
            //TODO: ISSUE WITH CORS in IE
            var self = this;
            var png64 = self.cy.png({ full: true });
            return png64;
        }

        var witTemplate = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="80"><path fill="backgroundColor" stroke="borderColor" d="M0 0h210v80H0z"/><path fill="witColor" d="M0 0h6v80H0z"/>textTemplate</svg>';
        var witTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">textId</tspan><tspan x="76">textTitle1</tspan>  <tspan x="16" dy="16">textTitle2</tspan>  <tspan x="16" dy="16">textAssignedTo</tspan> <tspan x="16" dy="16">textState</tspan></text>';
        WorkitemVisualizationGraph.prototype.getWitBackground = function (type, cardText, backgroundColor, borderColor, textColor) {
            if (backgroundColor == undefined) backgroundColor = defaultBackgroundColor;
            if (borderColor == undefined) borderColor = defaultBorderColor;
            if (textColor == undefined) textColor = defaultTextColor;

            var witColor = "";
            switch (type) {
                case "Shared Steps":
                    witColor = "#FF9D00";
                    break;
                case "Feedback Request":
                    witColor = "#FF9D00";
                    break;
                case "Feedback Response":
                    witColor = "#FF9D00";
                    break;
                case "Code Review Request":
                    witColor = "#FF9D00";
                    break;
                case "Code Review Response":
                    witColor = "#FF9D00";
                    break;
                case "Issue":
                    witColor = "#FF9D00";
                    break;
                case "User Story":
                    witColor = "#009CCC";
                    break;
                case "Product Backlog Item":
                    witColor = "#009CCC";
                    break;
                case "Task":
                    witColor = "#F2CB1D";
                    break;
                case "Test Case":
                    witColor = "#FF9D00";
                    break;
                case "Bug":
                    witColor = "#CC293D";
                    break;
                case "Impediment":
                    witColor = "#CC293D";
                    break;
                case "Feature":
                    witColor = "#773B93";
                    break;
                case "Test Suite":
                    witColor = "#009CCC";
                    break;
                case "Test Plan":
                    witColor = "#773B93";
                    break;
                case "Epic":
                    witColor = "#FF7B00";
                    break;
                default:
                    witColor = "#F2CB1D";
            }

            var witBg = witTemplate.replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
                                .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/witColor/g, witColor);
            
            if (window.btoa) {
                //To make sure all UTF8 characters work
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(witBg)));
            } else {
                return "";
            }
        }

        WorkitemVisualizationGraph.prototype.getWitText = function (id, title, state, type, assignedTo) {
            //Currently 2 lines supprted,  later on will make the node size dynamic (with min defined) and then can show all of it
            var trim = function (str) {
                if (!str) {
                    return "";
                }
                if (str.trim) {
                    return str.trim();
                } else {
                    return str.replace(/^\s+|\s+$/gm, '');
                }
            }

            title = trim(title);
            title = xmlSafe(title);

            var words = title.split(" ");
            var line = "";
            var lines = new Array();
            for (var i = 0; i < words.length; i++) {
                //See how long the combination will be
                var t = line + words[i];

                //first line is shorter - 23 char
                if (t.length > 23 && lines.length === 0) {
                    //store the current value as line
                    lines.push(line);
                    //start the new line
                    line = "";
                }
                    //all other lines are longer - 32char
                else if (t.length > 32 && lines.length > 0) {
                    //store the current value as line
                    lines.push(line);
                    //start the new line
                    line = "";
                }

                //continue adding words to line
                line += words[i] + " ";

                //if its the last word, push the line
                if (i + 1 === words.length) {
                    lines.push(line);
                }
            }

            var witText = witTextTemplate.replace(/textTitle1/g, lines[0]).replace(/textTitle2/g, lines.length > 1 ? lines[1] : "")
                                        .replace(/textAssignedTo/g, assignedTo).replace(/textState/g, state)
                                        .replace(/textId/g, id);

            return witText;
        }

        var artifactTemplate = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="80"><path fill="backgroundColor" stroke="borderColor" d="M0 0h210v80H0z"/><path fill="cardColor" d="M0 0h6v80H0z"/>textTemplate</svg>';
        var artifactTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">artifactType</tspan> <tspan x="16" dy="16">artifactId</tspan> <tspan x="16" dy="16">artifactDate</tspan> <tspan x="16" dy="16">artifactAssignedTo</tspan></text>';
        WorkitemVisualizationGraph.prototype.getArtifactBackground = function (type, cardText, backgroundColor, borderColor, textColor) {
            if (backgroundColor == undefined) backgroundColor = defaultBackgroundColor;
            if (borderColor == undefined) borderColor = defaultBorderColor;
            if (textColor == undefined) textColor = defaultTextColor;

            var cardColor = "";
            switch (type) {
                case "Commit":
                case "Changeset":
                    cardColor = "#000000";
                    break;
                case "File":
                    cardColor = "#D6CE95";
                    break;
                default:
                    cardColor = "#F2CB1D";
            }


            var cardBg = artifactTemplate.replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
                                        .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/cardColor/g, cardColor);

            if (window.btoa) {
                //To make sure all UTF8 characters work
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(cardBg)));
            } else {
                //For IE9 and below
                return "";
            }
        }

        WorkitemVisualizationGraph.prototype.getArtifactText = function (type, artifactId, createdDate, assignedTo) {
            var cardText = artifactTextTemplate.replace(/artifactType/g, type).replace(/artifactId/g, artifactId)
                                    .replace(/artifactDate/g, createdDate).replace(/artifactAssignedTo/g, assignedTo);

            return cardText;
        }

        return WorkitemVisualizationGraph;
    })();
    exports.graph = new WorkitemVisualizationGraph($("#cy"), cytoscape);
});
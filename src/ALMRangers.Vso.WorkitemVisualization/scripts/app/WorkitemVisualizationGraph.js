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

define(["require", "exports", "Scripts/App/AnnotationForm", ], function (require, exports, AnnotationForm) {
    var WorkitemVisualizationGraph = (function() {
        
        var _navigator = null;
        var _container = null;
        var _expandNodeCallback = null;
        var defaultBackgroundColor = "#fff";
        var defaultBorderColor = "#000";
        var defaultTextColor = "#000";
        var graphLoaded = false;

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
                            case "Annotation":
                                self.openAnnotation(e.cyTarget);
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
            var id = node.data("origId");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri + "/" + vsoContext.project.name + "/_workitems#id=" + id + "&triage=true&_a=edit";
            window.open(location, "_blank");
        }

        WorkitemVisualizationGraph.prototype.openAnnotation = function (node) {
            var self = this;

            var id = node.data("origId");
            var frm = AnnotationForm.annotationForm;
            
            frm.showAnnotationForm(this, node.data(), this.getAllNodes(), function (title, txt, shapeType, size, linkedToId) {
                n2  =      self.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
                node.data("title", n2.data.title);
                node.data("content", n2.data.content);
                node.data("linkedToId", n2.data.linkedToId);
                node.data("shapeType", n2.data.shapeType);
                node.data("bgImage", n2.data.bgImage);
                
                self.refreshLayout();

            });
        }

        WorkitemVisualizationGraph.prototype.openCheckin = function (node) {
            var id = node.data("origId");
            var category = node.data("category");
            var vsoContext = VSS.getWebContext();
            var location = vsoContext.host.uri;

            if (category === "Commit") {
                //TODO: Cant we use and store the remote url of commit?
                location = node.data("url");  //+= "/_git/" + vsoContext.project.name + "/commit/" + id;
            } else {
                //TODO: Cant we use and store the remote url of changeset - if exists?
                location += "/" + vsoContext.project.name + "/_versionControl/changeset/" + id;
            }

            window.open(location, "_blank");
        }
        WorkitemVisualizationGraph.prototype.openFile = function (node) {
            //BUG: If commit or file is from different project, then it would not go to right location!
            var objectType = node.data("objectType");
            //Full path
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

        WorkitemVisualizationGraph.prototype.getAllNodes = function () {
            return this.cy.nodes();
        }

        WorkitemVisualizationGraph.prototype.isGraphLoaded = function () {
            return graphLoaded;
        }

        WorkitemVisualizationGraph.prototype.createNoteData= function (id, title, txt, shapeType, size, backgroundColor , linkedtoId) {
     
            backgroundColor = "#FFFFFF";
            var borderColor = "#FFFFFF";

            var newNode = {
                id: "Note" + id,
                origId: id,
                title: title,
                category: "Annotation",
                content: txt,
                size: size,
                shapeType: shapeType,
                linkedToId: linkedtoId,
                bgImage: this.getNoteBackground(title, txt, shapeType, size, backgroundColor, borderColor),
            };

            return { group: 'nodes', data: newNode };
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
                case "Note":
                    cardColor = backgroundColor;
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
        var template_Yellow_NOTE_Background  = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path fill="#ffffa5" stroke="borderColor" d="M0 0h210v80H0z"/>textTemplate</svg>';
        var template_Red_NOTE_Background     = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path fill="#FFC0CB" stroke="RED" d="M0 0h210v80H0z"/>textTemplate</svg>';
        var template_Red_Arrow_Background    = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="pink" stroke="red" />textTemplate</svg>';
        var template_Yellow_Arrow_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="#ffffa5" stroke="black" />textTemplate</svg>';
        var template_Green_Arrow_Background  = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="#00CC00" stroke="green" />textTemplate</svg>';

        var template_TEXT_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" ><path fill="#fff" stroke="#fff" d="M0 0h210v80H0z"/>textTemplate</svg>';

        var noteTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">noteTitle</tspan> <tspan x="16" dy="16">noteText</tspan></text>';

        function getNoteTemplate(shapeType) {
            switch (shapeType) {
                case "Text":
                    return template_TEXT_Background;
                    break;
                case "Red Note":
                    return template_Red_NOTE_Background;
                    break;
                case "Yellow Note":
                    return template_Yellow_NOTE_Background;
                    break;
                case "Yellow Arrow":
                    return template_Yellow_Arrow_Background;
                    break;
                case "Red Arrow":
                    return template_Red_Arrow_Background;
                    break;
                case "Green Arrow":
                    return template_Green_Arrow_Background;
                    break;
            }
        }

        function getAnnotationSize(sizeTxt) {
            switch (sizeTxt) {
                case "Small":
                    return { width: 210, height: 80 };
                    break;
                case "Medium":
                    return { width: 300, height: 120 };
                    break;
                case "Large":
                    return { width: 400, height: 160 };
                    break;

            }

        }

        WorkitemVisualizationGraph.prototype.getNoteBackground = function (title, text, shapeType, sizeTxt, backgroundColor, borderColor, textColor) {
            if (backgroundColor == undefined) backgroundColor = defaultBackgroundColor;
            if (borderColor == undefined) borderColor = defaultBorderColor;
            if (textColor == undefined) textColor = defaultTextColor;

            

            var cardText = noteTextTemplate.replace(/noteTitle/g, title).replace(/noteText/g, text);
            var cardBg;
            var size = getAnnotationSize(sizeTxt);
            cardBg = getNoteTemplate(shapeType).replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
                                    .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/cardColor/g, backgroundColor)
                                    .replace(/size-width/g, size.width).replace(/size-height/g, size.height);

            
  
            if (window.btoa) {
                //To make sure all UTF8 characters work
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(cardBg)));
            } else {
                //For IE9 and below
                return "";
            }
        }


        return WorkitemVisualizationGraph;
    })();
    exports.graph = new WorkitemVisualizationGraph($("#cy"), cytoscape);
});
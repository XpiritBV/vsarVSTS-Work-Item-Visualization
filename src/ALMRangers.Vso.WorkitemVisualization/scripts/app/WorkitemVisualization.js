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

//TODO: Add bugs / pbis for this
//TODO: Highlight path to selected node
//TODO: Highlight elements that are being added

define(["require", "exports", "VSS/Controls", "VSS/Controls/Common", "VSS/Controls/Menus",
        "Scripts/App/MainMenu", "Scripts/App/LegendMenu", "Scripts/App/LegendGrid", "Scripts/App/Storage", "Scripts/App/WorkitemVisualizationGraph"],
    function (require, exports, Controls, Common, Menus, MainMenu, LegendMenu, LegendGrid, StorageLib, CyWorkitemVisualizationGraph) {
        var WorkitemVisualization = (function() {

            var linkTypes;
            var graph;
            var mainMenu;
            var legendMenu;
            var storage;

            function WorkitemVisualization() {
                storage = new StorageLib.VsoStoreService();
                graph = CyWorkitemVisualizationGraph.graph;
            }

            WorkitemVisualization.prototype.start = function () {
                var self = this;
                mainMenu = Controls.Enhancement.enhance(MainMenu.ItemsView, $(".hub-view"), {});
                legendMenu = Controls.Enhancement.enhance(LegendMenu.ItemsView, $(".hub-view"), {});
                
                graph.setExpandNodeCallback(self.expandNode.bind(this));
                mainMenu.setLoadWorkItemGraphCallback(self.loadInitialItem.bind(this));

                function loadLinkTypes(witLinkTypes) {
                    linkTypes = witLinkTypes;

                    // get everything after the ?
                    var queryString = window.location.search.substring(1);

                    if (queryString !== "") {
                        //Get the ID and value (which will be in querystringparams[0])
                        var param = queryString.split("=");
                        var id = parseInt(param[1]);

                        //Get workitem and load it into the graph
                        storage.getWorkItem(id, self.loadInitialItem.bind(self));
                    }
                }

                //Load link types for the use during the application lifetime. Starts the application flow.
                storage.getRelationTypes(loadLinkTypes);

                // Notify the parent frame that the host has been loaded
                VSS.notifyLoadSucceeded();

                ////Highlighting code
                //var highlightColor = "red";

                //// When a Link is selected, highlight it and both connected Nodes.
                //function linkSelectionChanged(link) {
                //    if (link.isSelected) {
                //        highlightLink(link, highlightColor);
                //        highlightNode(link.fromNode, highlightColor);
                //        highlightNode(link.toNode, highlightColor);
                //    } else {
                //        highlightLink(link);
                //        highlightNode(link.fromNode);
                //        highlightNode(link.toNode);
                //    }
                //}

                //// Highlight a Link by changing its Shape.stroke and strokeWidth.
                //function highlightLink(link, color) {
                //    if (link === null) return;
                //    var shape = link.findObject("LINKSHAPE");
                //    if (shape === null) return;
                //    if (color !== undefined) {
                //        if (!shape.previousStroke) shape.previousStroke = shape.stroke;
                //        shape.strokeWidth = 2;
                //        shape.stroke = color;
                //    } else { // restore previous color
                //        shape.strokeWidth = 1;
                //        if (!shape.previousStroke == null) {
                //            shape.stroke = shape.previousStroke;
                //        } else {
                //            shape.stroke = "black";
                //        }
                //    }
                //}

                //// When a Node is selected, show the selection and highlight all connected Links and Nodes.
                //function nodeSelectionChanged(node) {
                //    var shape = node.findObject("background");
                //    if (shape === null) return;
                //    if (node.isSelected) {
                //        // indicate selected node by changing fill color
                //        if (!shape.previousFill) shape.previousFill = shape.fill;
                //        shape.fill = "yellow";
                //        // use highlight color
                //        highlightNode(node, highlightColor);
                //        highlightConnectedNodes(node, highlightColor);
                //    } else { // restore previous colors
                //        shape.fill = shape.previousFill;
                //        highlightNode(node);
                //        highlightConnectedNodes(node);
                //    }
                //}

                //// Highlight a Node by changing its Shape.stroke.
                //function highlightNode(node, color) {
                //    if (node === null) return;
                //    var shape = node.findObject("background");
                //    if (shape === null) return;
                //    if (color !== undefined) {
                //        if (!shape.previousStroke) shape.previousStroke = shape.stroke;
                //        shape.stroke = color;
                //    } else { // restore previous color
                //        if (!shape.previousStroke == null) {
                //            shape.stroke = shape.previousStroke;
                //        } else {
                //            shape.stroke = "black";
                //        }
                //    }
                //}

                //function highlightConnectedNodes(node, color) {
                //    if (node === null) return;
                //    var lit = node.findLinksConnected();
                //    while (lit.next()) {
                //        highlightLink(lit.value, color);
                //    }
                //    var nit = node.findNodesConnected();
                //    while (nit.next()) {
                //        highlightNode(nit.value, color);
                //    }
                //}
            }

            WorkitemVisualization.prototype.loadInitialItem = function (wit) {
                var self = this;
                function afterGraphLoaded() {
                    mainMenu.EnableToolbar();
                    legendMenu.EnableAddItem(true);

                    var node = graph.findById("W" + wit.id);
                    self.expandNode(node);
                }

                var nodeData = graph.createWitNodeData(wit);
                var nodes = new Array();
                nodes.push(nodeData);

                graph.create(nodes, null, afterGraphLoaded);
            }

            WorkitemVisualization.prototype.expandNode = function (node) {
                var self = this;
                var id = node.id();
                var originalId = node.data("origId");

                switch (id.substring(0, 1)) {
                    case "W":
                        storage.getWorkItemWithLinks(originalId, self.addWorkitem.bind(this));
                        break;
                    case "C":
                        storage.getChangesetWorkitems(originalId, self.addChangesetWorkitems.bind(this), { id: originalId });
                        storage.getChangesetChanges(originalId, self.addChangesetChanges.bind(this), { id: originalId });
                        break;
                    case "G":
                        var repo = node.data("repo");
                        storage.getCommitChanges({ id: originalId, repo: repo }, self.addCommitChanges.bind(this));
                        break;
                    case "F":
                        {
                            var objectType = node.data("objectType");
                            if (objectType === "File") {
                                //This is tfvc
                                storage.getTfvcFileLinks(originalId, self.addTfvcFileLinks.bind(this), { id: id, origId: originalId });
                            } else {
                                //This is git
                                var repo = node.data("repo");
                                var path = node.data("path");
                                storage.getGitFileLinks(repo, path, self.addGitFileLinks.bind(this), { repo: repo, id: id, origId: originalId });
                            }
                            break;
                        }
                    default:
                }

                //Mark node expanded
                node.data("expanded", true);
            }

            WorkitemVisualization.prototype.addCommitNode = function (commit, data) {
                var self = this;
                var node = graph.createCommitNodeData(commit, data.repo);
                graph.addElement(node, data.edge);
            }

            WorkitemVisualization.prototype.addChangesetNode = function (cs, edge) {
                var self = this;
                var node = graph.createChangesetNodeData(cs);
                graph.addElement(node, edge);
            }

            WorkitemVisualization.prototype.addWitNodes = function (wits, data) {
                var self = this;
                var newNodes = new Array();

                for (var i = 0; i < wits.length; i++) {
                    var nodeData = graph.createWitNodeData(wits[i]);
                    newNodes.push(nodeData);
                }

                graph.addElements(newNodes, data.edges);
            }

            //TODO: Look to batch the element adding
            //This is called when the incremented node is a work item
            WorkitemVisualization.prototype.addWorkitem = function (wit) {
                var self = this;
                var id = wit.id;
                var workItemIdArray = new Array();
                var workItemLinksArray = new Array();

                //This can be null if there are no relationships on the work item...
                if (wit.relations != null) {
                    //Get all of the work items so we can make a single call
                    for (var i = 0; i < wit.relations.length; i++) {
                        //Get the id of the related item
                        var tempId = wit.relations[i].url.match("[^/]+$");
                        //Skip items which do not go to a work item (i.e. changesets and hyperlinks and documents)
                        if (self.getLinkType(wit.relations[i].rel) === "workItemLink") {
                            workItemIdArray.push(tempId[0]);
                            var link = graph.createNodeEdgeData("W" + id, "W" + tempId[0], self.getLinkTypeName(wit.relations[i].rel));

                            workItemLinksArray.push(link);
                        } else {
                            var changeType = self.isChangeset(wit.relations[i].url);
                            if (changeType === "Changeset") {
                                var link = graph.createNodeEdgeData("W" + id, "C" + tempId[0], self.getLinkTypeName(wit.relations[i].rel));
                                //Process the changsets now. All information is already available as we only 
                                //use the changeset id
                                storage.getChangesetDetails(tempId[0], self.addChangesetNode.bind(this), link);

                            } else if (changeType === "Commit") {
                                var commitInfo = tempId[0].split("%2f");
                                var link = graph.createNodeEdgeData("W" + id, "G" + commitInfo[2], self.getLinkTypeName(wit.relations[i].rel));

                                storage.getCommitDetails(commitInfo[2], commitInfo[1], self.addCommitNode.bind(this), { commitId: commitInfo[2], repo: commitInfo[1], edge: link });
                            }
                        }
                    } //end for

                    storage.getWorkItems(workItemIdArray, self.addWitNodes.bind(this), { id: "W" + wit.id, edges: workItemLinksArray });
                }
            }

            WorkitemVisualization.prototype.addChangesetWorkitems = function (wits, data) {
                var self = this;
                var workItemIdArray = new Array();
                var workItemLinksArray = new Array();
                var id = data.id;

                for (var i = 0; i < wits.length; i++) {
                    workItemIdArray.push(wits[i].id);
                    var link = graph.createNodeEdgeData("C" + id, "W" + wits[i].id, self.getLinkTypeName("ArtifactLink"));

                    workItemLinksArray.push(link);
                }

                storage.getWorkItems(workItemIdArray, self.addWitNodes.bind(this), { id: "C" + id, edges: workItemLinksArray });
            }

            WorkitemVisualization.prototype.addChangesetChanges = function (changes, data) {
                var self = this;
                var nodes = new Array();
                var edges = new Array();
                var id = data.id;

                for (var i = 0; i < changes.length; i++) {
                    var change = changes[i];

                    var node = graph.createFileNodeData(change, id);
                    nodes.push(node);
                    var edge = graph.createNodeEdgeData("C" + id, node.data.id, self.getLinkTypeName("ArtifactLink"));
                    edges.push(edge);
                }

                graph.addElements(nodes, edges);
            }

            WorkitemVisualization.prototype.addCommitChanges = function (commit, data) {
                var self = this;
                var nodes = new Array();
                var edges = new Array();

                for (var i = 0; i < commit.changes.length; i++) {
                    var node = graph.createCommitFileNodeData(commit.changes[i], data);
                    nodes.push(node);
                    var edge = graph.createNodeEdgeData("G" + data.id, node.data.id, self.getLinkTypeName("ArtifactLink"));
                    edges.push(edge);
                }

                graph.addElements(nodes, edges);
            }

            WorkitemVisualization.prototype.addGitFileLinks = function (commits, data) {
                var self = this;
                var nodes = new Array();
                var edges = new Array();

                var start = 0;
                if (commits.length > 0) {
                    start = commits[0].url.indexOf("repositories") + 13;
                }

                for (var i = 0; i < commits.length; i++) {

                    //TODO: test this or use data.repo
                    var newNode = graph.createCommitNodeData(commits[i], commits[i].url.substr(start, 36));
                    nodes.push(newNode);

                    var edge = graph.createNodeEdgeData(data.id, newNode.data.id, self.getLinkTypeName("ArtifactLink"));

                    edges.push(edge);
                }

                graph.addElements(nodes, edges);
            }

            WorkitemVisualization.prototype.addTfvcFileLinks = function (changesets, data) {
                var self = this;
                var nodes = new Array();
                var edges = new Array();

                for (var i = 0; i < changesets.length; i++) {

                    //TODO: test this or use data.repo
                    var newNode = graph.createChangesetNodeData(changesets[i]);
                    nodes.push(newNode);

                    var edge = graph.createNodeEdgeData(data.id, newNode.data.id, self.getLinkTypeName("ArtifactLink"));

                    edges.push(edge);
                }

                graph.addElements(nodes, edges);
            }


            //Returns true if the link type is directional, otherwise false
            //Note that this is simply returning the value of directional
            WorkitemVisualization.prototype.isDirectional = function (rel) {
                for (var i = 0; i < linkTypes.length; i++) {
                    if (rel === linkTypes[i].referenceName) {
                        return linkTypes[i].attributes["directional"];
                    }
                }
                return null;
            }

            //this function returns the usage attribute of a link
            //It can be workItemLink, resourceLink or artifactLink
            WorkitemVisualization.prototype.getLinkType = function (rel) {
                for (var i = 0; i < linkTypes.length; i++) {
                    if (rel === linkTypes[i].referenceName) {
                        return linkTypes[i].attributes["usage"];
                    }
                }
                return null;
            }

            //Returns the name of the link for the description
            WorkitemVisualization.prototype.getLinkTypeName = function (rel) {
                for (var i = 0; i < linkTypes.length; i++) {
                    if (rel === linkTypes[i].referenceName) {
                        return linkTypes[i].name;
                    }
                }
                return null;
            }

            //indicates if the reference link is a changeset
            WorkitemVisualization.prototype.isChangeset = function (url) {
                if (url.search("Changeset") > -1) {
                    return "Changeset";
                } else {
                    if (url.search("Commit") > -1) {
                        return "Commit";
                    } else {
                        return "";
                    }
                }
            }

            return WorkitemVisualization;
        })();

        exports.witviz = new WorkitemVisualization();
    });
/*---------------------------------------------------------------------
// <copyright file="WorkitemVisualization.js">
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

//TODO: Highlight path to selected node
//TODO: Highlight elements that are being added

define(["require", "exports", "VSS/Controls", "VSS/Controls/Menus",
        "Scripts/App/MainMenu", "Scripts/App/LegendMenu", "Scripts/App/LegendGrid", "Scripts/App/Storage", "Scripts/App/WorkitemVisualizationGraph", "Scripts/app/TelemetryClient"],
    function (require, exports, Controls, Menus, MainMenu, LegendMenu, LegendGrid, StorageLib, CyWorkitemVisualizationGraph, TelemetryClient) {
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

                    //Get workitem and load it into the graph
                    var config= VSS.getConfiguration();
                    if (config.action.workItemId ) {
                        TelemetryClient.getClient().trackEvent("Vizualize.One");
                        storage.getWorkItem(config.action.workItemId, self.loadInitialItem.bind(self));
                    }
                    else if (config.action.ids ) {
                        TelemetryClient.getClient().trackEvent("Vizualize.Multiple");
                        storage.getWorkItems(config.action.ids, self.loadInitialItem.bind(self));

                    }//For the backlog context menu
                    else if (config.action.workItemIds)
                    {
                        storage.getWorkItems(config.action.workItemIds, self.loadInitialItem.bind(self));
                    }
                }

                //Load link types for the use during the application lifetime. Starts the application flow.
                storage.getRelationTypes(loadLinkTypes);

                // Notify the parent frame that the host has been loaded
                VSS.notifyLoadSucceeded();
            }

            WorkitemVisualization.prototype.loadInitialItem = function (wit) {
                var self = this;
                var witArray =[].concat(wit);
        
                
                var nodes = new Array();

                witArray.forEach(function (i) {
                    var nodeData = graph.createWitNodeData(i);
                    nodes.push(nodeData);
                });

                function afterGraphLoaded() {
                    mainMenu.EnableToolbar();
                    legendMenu.EnableAddItem(true);

                    witArray.forEach(function (i) {
                        var node = graph.findById("W" + i.id);
                        legendMenu.ApplyLegendToNode(node);
                        self.expandNode(node);
                    });
                }

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
                var elements = graph.addElement(node, data.edge);
                elements.each(self.highlightNewNode);
            }

            WorkitemVisualization.prototype.addChangesetNode = function (cs, edge) {
                var self = this;
                var node = graph.createChangesetNodeData(cs);
                var elements = graph.addElement(node, edge);
                elements.each(self.highlightNewNode);
            }

            WorkitemVisualization.prototype.addWitNodes = function (wits, data) {
                var self = this;
                var newNodes = new Array();

                for (var i = 0; i < wits.length; i++) {
                    var nodeData = graph.createWitNodeData(wits[i]);
                    newNodes.push(nodeData);
                }

                var elements = graph.addElements(newNodes, data.edges);
                elements.each(self.highlightNewNode);
            }

            WorkitemVisualization.prototype.highlightNewNode = function (i, ele) {
                if (ele.isNode()) {
                    legendMenu.ApplyLegendToNode(ele);
                }
            }

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
                                var commitInfo = tempId[0].toLowerCase().split("%2f");
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

                var elements = graph.addElements(nodes, edges);
                elements.each(self.highlightNewNode);
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

                var elements = graph.addElements(nodes, edges);
                elements.each(self.highlightNewNode);
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

                var elements = graph.addElements(nodes, edges);
                elements.each(self.highlightNewNode);
            }

            WorkitemVisualization.prototype.addTfvcFileLinks = function (changesets, data) {
                var self = this;
                var nodes = new Array();
                var edges = new Array();

                for (var i = 0; i < changesets.length; i++) {

                    var newNode = graph.createChangesetNodeData(changesets[i]);
                    nodes.push(newNode);

                    var edge = graph.createNodeEdgeData(data.id, newNode.data.id, self.getLinkTypeName("ArtifactLink"));

                    edges.push(edge);
                }

                var elements = graph.addElements(nodes, edges);
                elements.each(self.highlightNewNode);
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
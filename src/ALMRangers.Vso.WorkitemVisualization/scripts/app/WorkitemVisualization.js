/*---------------------------------------------------------------------
// <copyright file="StateModelVisualization.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the State Model Visualization VSO extension by the
 //     ALM Rangers. The main application flow and logic.
 //  </summary>
//---------------------------------------------------------------------*/

var _linkTypes;

define(["VSS/Controls", "VSS/Controls/Common", "VSS/Controls/Menus",
        "Scripts/App/MainMenu", "Scripts/App/LegendMenu", "Scripts/App/LegendGrid", "Scripts/App/Storage", "Scripts/App/WorkitemVisualizationGraph"],
    function(Controls, Common, Menus, MainMenu, LegendMenu, LegendGrid, StorageLib, CyWorkitemVisualizationGraph) {
        var WorkitemVisualization = (function() {

            var linkTypes;
            var graph;
            var mainMenu;
            var legendMenu;

            function WorkitemVisualization() {
            }

            WorkitemVisualization.prototype.start = function () {
                mainMenu = Controls.Enhancement.enhance(MainMenu.ItemsView, $(".hub-view"), {});
                legendMenu = Controls.Enhancement.enhance(LegendMenu.ItemsView, $(".hub-view"), {});

                var Storage = new StorageLib.VsoStoreService();

                graph = CyWorkitemVisualizationGraph.graph;
                graph.setExpandNodeCallback(expandNode);
                mainMenu.setLoadWorkItemGraphCallback(loadInitialItem);

                function loadInitialItem(wit) {
                    function afterGraphLoaded() {
                        mainMenuView.EnableToolbar();
                        legendMenuView.EnableAddItem(true);

                        var node = graph.findById("W" + wit.id);
                        expandNode(node);
                    }

                    var nodeData = graph.createWitNodeData(wit);
                    var nodes = new Array();
                    nodes.push(nodeData);

                    graph.create(nodes, null, afterGraphLoaded);
                }


                //witClient.getRelationTypes().then(function(linkTypes) {
                function loadLinkTypes(linkTypes) {
                    _linkTypes = linkTypes;

                    // get everything after the ?
                    var queryString = window.location.search.substring(1);

                    if (queryString !== "") {
                        //Get the ID and value (which will be in querystringparams[0])
                        var param = queryString.split("=");
                        var id = parseInt(param[1]);

                        Storage.getWorkItem(id, loadInitialItem);
                        //witClient.getWorkItem(id, ["System.Id", "System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function(wit) {
                        //    loadInitialItem(wit);
                        //});

                    }
                }

                //}, function(error) {
                //    console.log(error);
                //});

                Storage.getRelationTypes(loadLinkTypes);

                function expandNode(node) {
                    var id = node.id();
                    var originalId = node.data("origId");

                    switch (id.substring(0, 1)) {
                    case "W":
                        //addWorkitem(originalId);
                        Storage.getWorkItemWithLinks(originalId, addWorkitem);
                        //getWorkItem(originalId);
                        break;
                    case "C":
                        Storage.getChangesetWorkitems(originalId, addChangesetWorkitems, { id: originalId });
                        //addChangesetWorkitems(originalId);
                        Storage.getChangesetChanges(originalId, addChangesetChanges, { id: originalId });
                        //addChangesetChanges(originalId);
                        //getChangeset(originalId);
                        break;
                    case "G":
                        var repo = node.data("repo");
                        Storage.getCommitChanges({ id: originalId, repo: repo }, addCommitChanges);
                        //addCommitChanges({ id: originalId, repo: repo });
                        //getCommit(node);
                        break;
                    case "F":
                    {
                        var objectType = node.data("objectType");
                        if (objectType === "File") {
                            //This is tfvc
                            Storage.getTfvcFileLinks(originalId, addTfvcFileLinks, { id: id, origId: originalId });
                            //addTfvcFileLinks(originalId, { id: id, origId: originalId });
                            //getTfvcFileLinks(node);
                        } else {
                            //This is git
                            //getGitFileLinks(node);
                            var repo = node.data("repo");
                            var path = node.data("path");
                            Storage.getGitFileLinks(repo, path, addGitFileLinks, { repo: repo, id: id, origId: originalId });
                            //addGitFileLinks(repo, path, { repo: repo, id: id, origId: originalId });
                        }
                        break;
                    }
                    default:
                    }

                    //Mark node expanded
                    node.data("expanded", true);
                }

                //function addCommitNode(commitId, repo, data) {
                //    //TODO: Missing information on project?
                //    gitClient.getCommit(commitId, repo).then(function(commit) {
                function addCommitNode(commit, data) {
                    var node = graph.createCommitNodeData(commit, data.repo);
                    graph.addElement(node, data.edge);
                    //});
                }

                //function addChangesetNode(id, edge) {
                //    tfvcClient.getChangeset(id, null, null, true).then(function(cs) {
                function addChangesetNode(cs, edge) {
                    var node = graph.createChangesetNodeData(cs);
                    graph.addElement(node, edge);
                    //});
                }

                //function addWitNodes(workItemIdArray, data) {
                //witClient.getWorkItems(workItemIdArray, ["System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function(wits) {
                function addWitNodes(wits, data) {
                    var newNodes = new Array();

                    for (var i = 0; i < wits.length; i++) {
                        var nodeData = graph.createWitNodeData(wits[i]);
                        newNodes.push(nodeData);
                    }

                    graph.addElements(newNodes, data.edges);
                    //});
                }

                //This is called when the incremented node is a work item
                function addWorkitem(wit) {
                    //witClient.getWorkItem(id, null, null, Tfs_Wit_Contracts.WorkItemExpand.Relations).then(function(wit) {
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
                            if (getLinkType(wit.relations[i].rel) === "workItemLink") {
                                workItemIdArray.push(tempId[0]);
                                var link = graph.createNodeEdgeData("W" + id, "W" + tempId[0], getLinkTypeName(wit.relations[i].rel));

                                workItemLinksArray.push(link);
                            } else {
                                var changeType = isChangeset(wit.relations[i].url);
                                if (changeType === "Changeset") {
                                    var link = graph.createNodeEdgeData("W" + id, "C" + tempId[0], getLinkTypeName(wit.relations[i].rel));
                                    //addChangesetNode(tempId[0], link);
                                    //Process the changsets now. All information is already available as we only 
                                    //use the changeset id
                                    Storage.getChangesetDetails(tempId[0], addChangesetNode, link);
                                    //add the link to the changeset
                                    //linksArray.push(link);
                                } else if (changeType === "Commit") {
                                    var commitInfo = tempId[0].split("%2f");
                                    var link = graph.createNodeEdgeData("W" + id, "G" + commitInfo[2], getLinkTypeName(wit.relations[i].rel));

                                    //addCommitNode(commitInfo[2], commitInfo[1], { commitId: commitInfo[2], repo: commitInfo[1], edge: link });
                                    Storage.getCommitDetails(commitInfo[2], commitInfo[1], addCommitNode, { commitId: commitInfo[2], repo: commitInfo[1], edge: link });

                                    //add the link to the changeset

                                    //linksArray.push(link);
                                }
                            }
                        } //end for

                        Storage.getWorkItems(workItemIdArray, addWitNodes, { id: "W" + wit.id, edges: workItemLinksArray });
                        //addWitNodes(workItemIdArray, { id: "W" + wit.id, edges: workItemLinksArray });
                    }
                    //});
                }

                //function addChangesetWorkitems(id) {
                //    tfvcClient.getChangesetWorkItems(id).then(function(wits) {
                function addChangesetWorkitems(wits, data) {
                    var workItemIdArray = new Array();
                    var workItemLinksArray = new Array();
                    var id = data.id;

                    for (var i = 0; i < wits.length; i++) {
                        workItemIdArray.push(wits[i].id);
                        //if (i < wits.length - 1) {
                        //    workItemIdArray += ",";
                        //}
                        var link = graph.createNodeEdgeData("C" + id, "W" + wits[i].id, getLinkTypeName("ArtifactLink"));

                        linksArray.push(link);
                    }

                    Storage.getWorkItems(workItemIdArray, addWitNodes, { id: "C" + id, edges: workItemLinksArray });
                    //addWitNodes(workItemIdArray, { id: "C" + id, edges: workItemLinksArray });
                    //});
                }

                //function addChangesetChanges(id) {
                //    tfvcClient.getChangesetChanges(id).then(function(changes) {
                function addChangesetChanges(changes, data) {
                    var nodes = new Array();
                    var edges = new Array();
                    var id = data.id;

                    for (var i = 0; i < changes.length; i++) {
                        var change = changes[i];

                        var node = graph.createFileNodeData(change, id);
                        nodes.push(node);
                        var edge = graph.createNodeEdgeData("C" + id, node.data.id, getLinkTypeName("ArtifactLink"));
                        edges.push(edge);
                    }

                    graph.addElements(nodes, edges);
                    //});
                }

                //function addCommitChanges(data) {
                //    //TODO: missing project?
                //    gitClient.getChanges(data.id, data.repo, null, 100).then(function(commit) {
                function addCommitChanges(commit, data) {
                    var nodes = new Array();
                    var edges = new Array();

                    for (var i = 0; i < commit.changes.length; i++) {
                        var node = graph.createCommitFileNodeData(commit.changes[i], data);
                        nodes.push(node);
                        var edge = graph.createNodeEdgeData("G" + data.id, node.data.id, getLinkTypeName("ArtifactLink"));
                        edges.push(edge);
                    }

                    graph.addElements(nodes, edges);
                    //});
                }

                //function addGitFileLinks(repo, path, data) {
                //    //TODO: missing project?
                //    gitClient.getCommits(repo, { itemPath: path }).then(function(commits) {
                function addGitFileLinks(commits, data) {
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

                        var edge = graph.createNodeEdgeData(data.id, newNode.data.id, getLinkTypeName("ArtifactLink"));

                        edges.push(edge);
                    }

                    graph.addElements(nodes, edges);
                    //});
                }

                //function addTfvcFileLinks(path, data) {
                //    tfvcClient.getChangesets({ itemPath: path }).then(function(changesets) {
                function addTfvcFileLinks(changesets, data) {
                    var nodes = new Array();
                    var edges = new Array();

                    for (var i = 0; i < changesets.length; i++) {

                        //TODO: test this or use data.repo
                        var newNode = graph.createChangesetNodeData(changesets[i]);
                        nodes.push(newNode);

                        var edge = graph.createNodeEdgeData(data.id, newNode.data.id, getLinkTypeName("ArtifactLink"));

                        edges.push(edge);
                    }

                    graph.addElements(nodes, edges);
                    //});
                }


                //Returns true if the link type is directional, otherwise false
                //Note that this is simply returning the value of directional
                function isDirectional(rel) {
                    for (var i = 0; i < _linkTypes.length; i++) {
                        if (rel === _linkTypes[i].referenceName) {
                            return _linkTypes[i].attributes["directional"];
                        }
                    }
                    return null;
                }

                //this function returns the usage attribute of a link
                //It can be workItemLink, resourceLink or artifactLink
                function getLinkType(rel) {
                    for (var i = 0; i < _linkTypes.length; i++) {
                        if (rel === _linkTypes[i].referenceName) {
                            return _linkTypes[i].attributes["usage"];
                        }
                    }
                    return null;
                }

                //Returns the name of the link for the description
                function getLinkTypeName(rel) {
                    for (var i = 0; i < _linkTypes.length; i++) {
                        if (rel === _linkTypes[i].referenceName) {
                            return _linkTypes[i].name;
                        }
                    }
                    return null;
                }

                //indicates if the reference link is a changeset
                function isChangeset(url) {
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
            return WorkitemVisualization;
        })();

        exports.witviz = new WorkitemVisualization();
    });
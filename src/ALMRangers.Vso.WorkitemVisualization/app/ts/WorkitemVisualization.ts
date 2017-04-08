/*---------------------------------------------------------------------
// <copyright file="WorkitemVisualization.ts">
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

import Controls = require("VSS/Controls")
import Menus = require("VSS/Controls/Menus")
import Dialogs = require("VSS/Controls/Dialogs")

import * as AnnotationForm from "./AnnotationForm"
import * as LegendMenu from "./LegendMenu"
import * as LegendGrid from "./LegendGrid"
import * as MainMenu from "./MainMenu"
import * as Storage from "./VsoStoreService"
import * as TelemetryClient from "./TelemetryClient"
import * as WorkitemVisualizationGraph from "./WorkitemVisualizationGraph"
import * as NodeData from "./Node"

import * as HighlightDlg from "./AddEditHighlightDialog"
import * as FindDlg from "./FindWitDialog"
import * as PrntGraph from "./PrintGraph"
import * as Common from "./Common"


export class WorkitemVisualization {
    private linkTypes: any;
    private graph: any;
    private mainMenu: any;
    private legendMenu: any;
    private storage: any;
    private nodeDataFactory: NodeData.NodeDataFactory;
    public nodeExpansionFilter : Common.FilterTypes; 


    constructor() {
        this.storage = new Storage.VsoStoreService();
        this.graph = WorkitemVisualizationGraph.graph;
        this.nodeDataFactory = new NodeData.NodeDataFactory();
        this.nodeExpansionFilter = Common.FilterTypes.WorkItemOnly; //default WorkItemOnly
    }

    public start() {
        var self = this;

        self.mainMenu = Controls.Enhancement.enhance(MainMenu.MainMenu, $(".hub-view"), {});
        self.legendMenu = Controls.Enhancement.enhance(LegendMenu.LegendItemsMenu, $(".hub-view"), {});

        self.graph.setExpandNodeCallback(self.expandNode.bind(this));
        self.mainMenu.setLoadWorkItemGraphCallback(self.loadInitialItem.bind(this));

        function loadLinkTypes(witLinkTypes) {
            self.linkTypes = witLinkTypes;

            //Get workitem and load it into the graph
            var config = VSS.getConfiguration();
            if (config.action.workItemId) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("Vizualize.OneFromForm");
                self.storage.getWorkItem(config.action.workItemId, self.loadInitialItem.bind(self));
            }
            else if (config.action.id) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("Vizualize.OneFromBoard");
                self.storage.getWorkItem(config.action.id, self.loadInitialItem.bind(self));
            }
            else if (config.action.ids) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("Vizualize.Multiple.FromQuery");
                self.storage.getWorkItems(config.action.ids, self.loadInitialItem.bind(self));

            }//For the backlog context menu
            else if (config.action.workItemIds) {
                TelemetryClient.TelemetryClient.getClient().trackEvent("Vizualize.Multiple.FromBacklog");
                self.storage.getWorkItems(config.action.workItemIds, self.loadInitialItem.bind(self));
            }
        }

        //Load link types for the use during the application lifetime. Starts the application flow.
        self.storage.getRelationTypes(loadLinkTypes);

        // Notify the parent frame that the host has been loaded
        VSS.notifyLoadSucceeded();
    }

    loadInitialItem(wit) {
        var self = this;
        var witArray = [].concat(wit);

        var nodes = new Array();

        witArray.forEach(function (i) {
            var nodeData = self.nodeDataFactory.createWitNodeData(i);
            nodes.push(nodeData);
        });

        function afterGraphLoaded() {
            self.mainMenu.EnableToolbar();
            self.legendMenu.EnableAddItem(true);

            witArray.forEach(function (i) {
                var node = self.graph.findById("W" + i.id);
                self.legendMenu.ApplyLegendToNode(node);
                self.expandNode(node);

                if (typeof self.mainMenu._selectedFavorite != 'undefined') {
                    //Find node
                    var pos = self.mainMenu._selectedFavorite.idList.filter(function (w) { return w.id === i.id; })[0].position;
                    node._private.position = pos;
                }
            });
        }

        self.graph.create(nodes, null, afterGraphLoaded);
    }

    expandNode(node) {
        var self = this;
        var id = node.id();
        var originalId = node.data("origId");

        switch (id.substring(0, 1)) {
            case "W":
                TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandWorkItem");
                self.storage.getWorkItemWithLinks(originalId, self.addWorkitem.bind(this));
                break;
            case "C":
                TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandChangeset");
                self.storage.getChangesetWorkitems(originalId, self.addChangesetWorkitems.bind(this), { id: originalId });
                self.storage.getChangesetChanges(originalId, self.addChangesetChanges.bind(this), { id: originalId });
                break;
            case "G":
                TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandCommit");
                var repo = node.data("repo");
                self.storage.getCommitChanges({ id: originalId, repo: repo }, self.addCommitChanges.bind(this));
                break;
            case "P":
                TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandPullRequest");
                var repo = node.data("repo");
                self.storage.getPullRequestLinks({ id: originalId, repo: repo }, self.addPullRequestLinks.bind(this));
                break;

            case "F":
                {
                    var objectType = node.data("objectType");
                    if (objectType === "File") {
                        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandTfvcFile");
                        //This is tfvc
                        self.storage.getTfvcFileLinks(originalId, self.addTfvcFileLinks.bind(this), { id: id, origId: originalId });
                    } else {
                        TelemetryClient.TelemetryClient.getClient().trackEvent("Visualization.expandGitFile");
                        //This is git
                        var repo = node.data("repo");
                        var path = node.data("path");
                        self.storage.getGitFileLinks(repo, path, self.addGitFileLinks.bind(this), { repo: repo, id: id, origId: originalId });
                    }
                    break;
                }
            default:
        }

        //Mark node expanded
        node.data("expanded", true);
    }

    addCommitNode(commit, data) {
        var self = this;
        var node = self.nodeDataFactory.createCommitNodeData(commit, data.repo);
        //Apply legend to node data before its added to graph, so its less of re-rendering and quircky
        self.legendMenu.ApplyLegendToNodeData(node);
        var elements = self.graph.addElement(node, data.edge);
    }

    addChangesetNode(cs, edge) {
        var self = this;
        var node = self.nodeDataFactory.createChangesetNodeData(cs);
        self.legendMenu.ApplyLegendToNodeData(node);
        var elements = self.graph.addElement(node, edge);
    }


    addPullRequestNode(pr, edge) {
        var self = this;
        var node = self.nodeDataFactory.createPullRequestNodeData(pr);
        self.legendMenu.ApplyLegendToNodeData(node);
        var elements = self.graph.addElement(node, edge);
    }



    addWitNodes(wits, data) {
        var self = this;
        var newNodes = new Array();

        for (var i = 0; i < wits.length; i++) {
            var nodeData = self.nodeDataFactory.createWitNodeData(wits[i]);
            self.legendMenu.ApplyLegendToNodeData(nodeData);
            newNodes.push(nodeData);
        }
        var elements = self.graph.addElements(newNodes, data.edges);
    }

    //This is called when the incremented node is a work item
    addWorkitem(wit) {
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
                var linkType = self.getLinkType(wit.relations[i].rel);
                if (linkType === "workItemLink") {
                    workItemIdArray.push(tempId[0]);
                    var link = self.nodeDataFactory.createNodeEdgeData("W" + id, "W" + tempId[0], self.getLinkTypeName(wit.relations[i].rel));
                    workItemLinksArray.push(link);

                    /* This one creates forward direction
                    var sourceId = "W" + id;
                    var targetId = "W" + tempId[0];
                    var relRefId = wit.relations[i].rel;
                    if (!relRefId.match("-Reverse$")) {//Endswith
                        //We only add forward links, as the addElement function checks for links in both directions and only adds the first link between 2 workitems
                        var link = graph.createNodeEdgeData(sourceId, targetId, self.getLinkTypeName(relRefId));
                        workItemLinksArray.push(link);
                    }
                    */

                } else {
                    var changeType = self.isChangeset(wit.relations[i].url);
                    if (changeType === "Changeset") {
                        var link = self.nodeDataFactory.createNodeEdgeData("W" + id, "C" + tempId[0], self.getLinkTypeName(wit.relations[i].rel));
                        //Process the changsets now. All information is already available as we only
                        //use the changeset id
                        self.storage.getChangesetDetails(tempId[0], self.addChangesetNode.bind(this), link);
                    }
                    else if (changeType === "PullRequest") {
                        var pullRequestInfo = tempId[0].toLowerCase().split("%2f");
                        var link = self.nodeDataFactory.createNodeEdgeData("W" + id, "P" + pullRequestInfo[2], self.getLinkTypeName(wit.relations[i].rel));

                        self.storage.getPullRequestDetails(pullRequestInfo[2], pullRequestInfo[1], self.addPullRequestNode.bind(this), link);
                    } else if (changeType === "Commit") {
                        var commitInfo = tempId[0].toLowerCase().split("%2f");
                        var link = self.nodeDataFactory.createNodeEdgeData("W" + id, "G" + commitInfo[2], self.getLinkTypeName(wit.relations[i].rel));

                        self.storage.getCommitDetails(commitInfo[2], commitInfo[1], self.addCommitNode.bind(this), { commitId: commitInfo[2], repo: commitInfo[1], edge: link });
                    }
                }
            } //end for

            self.storage.getWorkItems(workItemIdArray, self.addWitNodes.bind(this), { id: "W" + wit.id, edges: workItemLinksArray });
        }
    }

    //This is called to add a note
    addNote(id, title, txt, shapeType, size, color, linkedToId) {
        var self = this;
        var node = self.nodeDataFactory.createNoteData(id, title, txt, shapeType, size, null, linkedToId);
        var edges = { group: 'edges', data: {} };
        if (linkedToId != null) {
            edges = self.nodeDataFactory.createNodeEdgeData(
                node.data.id,
                linkedToId,
                ""
            );
        }

        self.graph.addElements([node], [edges]);
    }

    addChangesetWorkitems(wits, data) {
        var self = this;
        var workItemIdArray = new Array();
        var workItemLinksArray = new Array();
        var id = data.id;

        for (var i = 0; i < wits.length; i++) {
            workItemIdArray.push(wits[i].id);
            var link = self.nodeDataFactory.createNodeEdgeData("C" + id, "W" + wits[i].id, self.getLinkTypeName("ArtifactLink"));

            workItemLinksArray.push(link);
        }

        self.storage.getWorkItems(workItemIdArray, self.addWitNodes.bind(this), { id: "C" + id, edges: workItemLinksArray });
    }

    addChangesetChanges(changes, data) {
        var self = this;
        var nodes = new Array();
        var edges = new Array();
        var id = data.id;

        for (var i = 0; i < changes.length; i++) {
            var change = changes[i];

            var node = self.nodeDataFactory.createFileNodeData(change, id);
            self.legendMenu.ApplyLegendToNodeData(node);
            nodes.push(node);
            var edge = self.nodeDataFactory.createNodeEdgeData("C" + id, node.data.id, self.getLinkTypeName("ArtifactLink"));
            edges.push(edge);
        }
        var elements = self.graph.addElements(nodes, edges);
    }

    addCommitChanges(commit, data) {
        var self = this;
        var nodes = new Array();
        var edges = new Array();

        for (var i = 0; i < commit.changes.length; i++) {
            var node = self.nodeDataFactory.createCommitFileNodeData(commit.changes[i], data);
            self.legendMenu.ApplyLegendToNodeData(node);
            nodes.push(node);
            var edge = self.nodeDataFactory.createNodeEdgeData("G" + data.id, node.data.id, self.getLinkTypeName("ArtifactLink"));
            edges.push(edge);
        }

        var elements = self.graph.addElements(nodes, edges);
    }

    addPullRequestLinks(pr, data) {
        var self = this;
        var nodes = new Array();
        var edges = new Array();

        if (pr.lastMergeSourceCommit != null) {
            var commitId = pr.lastMergeSourceCommit.commitId;
            var repoId = pr.repository.id
            var link = self.nodeDataFactory.createNodeEdgeData("P" + pr.pullRequestId, "G" + commitId, "Source Commit");
            self.storage.getCommitDetails(commitId, repoId, self.addCommitNode.bind(this), { commitId: commitId, repo: repoId, edge: link });
        }

        if (pr.lastMergeTargetCommit != null) {
            var commitId = pr.lastMergeTargetCommit.commitId;
            var repoId = pr.repository.id
            var link = self.nodeDataFactory.createNodeEdgeData("P" + pr.pullRequestId, "G" + commitId, "Target Commit");
            self.storage.getCommitDetails(commitId, repoId, self.addCommitNode.bind(this), { commitId: commitId, repo: repoId, edge: link });

            //var node = graph.createCommitFileNodeData(commit.changes[i], data);
            //nodes.push(node);
            //var edge = graph.createNodeEdgeData("G" + data.id, node.data.id, self.getLinkTypeName("ArtifactLink"));
            //edges.push(edge);
        }


        //var elements = graph.addElements(nodes, edges);
        //elements.each(self.highlightNewNode);
    }

    addGitFileLinks(commits, data) {
        var self = this;
        var nodes = new Array();
        var edges = new Array();

        var start = 0;
        if (commits.length > 0) {
            start = commits[0].url.indexOf("repositories") + 13;
        }

        for (var i = 0; i < commits.length; i++) {

            //TODO: test this or use data.repo
            var newNode = self.nodeDataFactory.createCommitNodeData(commits[i], commits[i].url.substr(start, 36));
            self.legendMenu.ApplyLegendToNodeData(newNode);
            nodes.push(newNode);

            var edge = self.nodeDataFactory.createNodeEdgeData(data.id, newNode.data.id, self.getLinkTypeName("ArtifactLink"));

            edges.push(edge);
        }

        var elements = self.graph.addElements(nodes, edges);
    }

    addTfvcFileLinks(changesets, data) {
        var self = this;
        var nodes = new Array();
        var edges = new Array();

        for (var i = 0; i < changesets.length; i++) {

            var newNode = self.nodeDataFactory.createChangesetNodeData(changesets[i]);
            self.legendMenu.ApplyLegendToNodeData(newNode);
            nodes.push(newNode);

            var edge = self.nodeDataFactory.createNodeEdgeData(data.id, newNode.data.id, self.getLinkTypeName("ArtifactLink"));

            edges.push(edge);
        }

        var elements = self.graph.addElements(nodes, edges);
    }

    refreshWorkItemNodes() {
        //TODO: Review, why does it refresh work item nodes, and none of the other ones ?
        var self = this;
        var lstWI = self.graph.getAllNodes();
        var lstWorkItemId = lstWI.filter(function (f) {
            return lstWI[f].data("category") == "Work Item";
        }).map(function (i) {
            return i.data("origId");
        });

        self.storage.getWorkItems(lstWorkItemId, self.updateWorkItemNodes.bind(this));
    }

    updateWorkItemNodes(wit) {
        var self = this;
        var nodes = self.graph.getAllNodes();

        wit.forEach(function (w) {
            var nodeData = self.nodeDataFactory.createWitNodeData(w);

            var existingNode = nodes.filter(function (f) { return nodes[f].data("category") == "Work Item" && nodes[f].data("origId") == w.id })[0];
            existingNode.data(nodeData.data);
        });

    }

    //Returns true if the link type is directional, otherwise false
    //Note that this is simply returning the value of directional
    isDirectional(rel) {
        var self = this;
        for (var i = 0; i < self.linkTypes.length; i++) {
            if (rel === self.linkTypes[i].referenceName) {
                return self.linkTypes[i].attributes["directional"];
            }
        }
        return null;
    }

    //this function returns the usage attribute of a link
    //It can be workItemLink, resourceLink or artifactLink
    getLinkType(rel) {
        var self = this;
        for (var i = 0; i < self.linkTypes.length; i++) {
            if (rel === self.linkTypes[i].referenceName) {
                return self.linkTypes[i].attributes["usage"];
            }
        }
        return null;
    }

    //Returns the name of the link for the description
    getLinkTypeName(rel) {
        var self = this;
        for (var i = 0; i < self.linkTypes.length; i++) {
            if (rel === self.linkTypes[i].referenceName) {
                return self.linkTypes[i].name;
            }
        }
        return null;
    }

    //TODO: This allows to show both Child / Parent link text on the label on edge
    getLinkText(rel) {
        var self = this;
        //Create the reverse directional link url based on the given rel
        var forward = "Forward", reverse = "Reverse";
        var forwardRel = rel;
        var reverseRel = "";
        if (rel.endsWith(forward)) {
            reverseRel = rel.replace(forward, reverse);

        }
        else if (rel.endsWith(reverse)) {
            reverseRel = rel;
            forwardRel = rel.replace(reverse, forward);
        }

        var linkForwardText = "";
        var linkReverseText = "";
        for (var i = 0; i < self.linkTypes.length; i++) {
            if (forwardRel === self.linkTypes[i].referenceName) {
                linkForwardText = self.linkTypes[i].name;
            }
            else if (reverseRel !== "" && reverseRel === self.linkTypes[i].referenceName) {
                linkReverseText = " / " + self.linkTypes[i].name;
            }

            //We are done when both texts are not empty or the forward has text and reverse shouldnt
            if ((linkForwardText !== "" && linkReverseText !== "") || (linkForwardText !== "" && reverseRel === "")) {
                return linkForwardText + linkReverseText;
            }
        }

        //Safety in case there is a scenario with custom link types where same naming is not used. Always return based on the forward then.
        if (linkForwardText !== "")
            return linkForwardText;

        return null;
    }

    //indicates if the reference link is a changeset
    isChangeset(url) {
        if (url.search("Changeset") > -1) {
            return "Changeset";
        }
        else if (url.search("PullRequest") > -1) {
            return "PullRequest";
        }
        else {
            if (url.search("Commit") > -1) {
                return "Commit";
            } else {
                return "";
            }
        }
    }

}
// export function PrintGraph(context) {
//     return new PrntGraph.PrintGraph(context);
// }
export let witviz = new WorkitemVisualization();
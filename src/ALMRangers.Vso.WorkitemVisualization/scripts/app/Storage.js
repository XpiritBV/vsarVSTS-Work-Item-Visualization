/*---------------------------------------------------------------------
// <copyright file="Storage.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The communication logic with VSO REST clients.
 //  </summary>
//---------------------------------------------------------------------*/

define(["require", "exports",
"TFS/WorkItemTracking/Services", "VSS/Service", "TFS/WorkItemTracking/RestClient", "TFS/Core/RestClient", "TFS/VersionControl/GitRestClient", "TFS/VersionControl/TfvcRestClient",
"TFS/WorkItemTracking/Contracts"],
function (require, exports, Tfs_Wit_Service, VSS_Service, Tfs_Wit_Client, Tfs_Core_Client, Tfs_Git_Client, Tfs_Tfvc_Client, Tfs_Wit_Contracts) {
    var VsoStoreService = (function () {
        function VsoStoreService() {
            this.vsoContext = VSS.getWebContext();

            this.witClient = Tfs_Wit_Client.getClient();
            this.coreClient = Tfs_Core_Client.getClient();
            this.gitClient = Tfs_Git_Client.getClient();
            this.tfvcClient = Tfs_Tfvc_Client.getClient();
        }
        VsoStoreService.prototype.getRelationTypes = function (callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getRelationTypes().then(function(linkTypes) { callback(linkTypes); });
        };
        VsoStoreService.prototype.getProjectInfo = function (callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.coreClient.getProject(self.vsoContext.project.id, true, false).then(function (projectInfo) { callback(projectInfo); });
        };
        VsoStoreService.prototype.getWorkItem = function (id, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItem(id, ["System.Id", "System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function (wit) { callback(wit); });
        };

        VsoStoreService.prototype.getWorkItemWithLinks = function (id, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItem(id, null, null, Tfs_Wit_Contracts.WorkItemExpand.Relations).then(function (wit) { callback(wit); });
        };

        VsoStoreService.prototype.getChangesetDetails = function (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangeset(id, null, null, true).then(function (cs) { callback(cs, callbackData); });
        };

        VsoStoreService.prototype.getCommitDetails = function (commitId, repo, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }

            self.gitClient.getCommit(commitId, repo).then(function (cs) { callback(cs, callbackData); });
        };

        VsoStoreService.prototype.getChangesetWorkitems = function (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangesetWorkItems(id).then(function (wits) { callback(wits, callbackData); });
        };

        VsoStoreService.prototype.getChangesetChanges = function (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangesetChanges(id).then(function (changes) { callback(changes, callbackData); });
        };

        VsoStoreService.prototype.getCommitChanges = function (data, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.gitClient.getChanges(data.id, data.repo, null, 100).then(function (commit) { callback(commit, data); });
        };

        VsoStoreService.prototype.getWorkItems = function (workItemIdArray, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItems(workItemIdArray, ["System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function (wits) { callback(wits, callbackData); });
        };

        VsoStoreService.prototype.getGitFileLinks = function (repo, path, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.gitClient.getCommits(repo, { itemPath: path}).then(function (commits) { callback(commits, callbackData); });
        };

        VsoStoreService.prototype.getTfvcFileLinks = function (path, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangesets(self.vsoContext.project.id, { path: path }).then(function (changesets) { callback(changesets, callbackData); });
        };

        return VsoStoreService;
    })();
    exports.VsoStoreService = VsoStoreService;
});
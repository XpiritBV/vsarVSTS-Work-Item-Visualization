/*---------------------------------------------------------------------
// <copyright file="VsoStoreService.ts">
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

import Tfs_Wit_Service = require("TFS/WorkItemTracking/Services")
import VSS_Service = require("VSS/Service")
import Tfs_Wit_Client = require("TFS/WorkItemTracking/RestClient")
import Tfs_Core_Client = require("TFS/Core/RestClient")
import Tfs_Git_Client = require("TFS/VersionControl/GitRestClient")
import Tfs_Tfvc_Client = require("TFS/VersionControl/TfvcRestClient")
import Tfs_Wit_Contracts = require("TFS/WorkItemTracking/Contracts")
import Tfs_Vc_Contracts = require("TFS/VersionControl/Contracts")

/**
 * VsoStoreService
 */
export class VsoStoreService {
    private vsoContext : WebContext;
    private witClient : Tfs_Wit_Client.WorkItemTrackingHttpClient2_3;
    private coreClient : Tfs_Core_Client.CoreHttpClient2_3;
    private gitClient : Tfs_Git_Client.GitHttpClient2_3;
    private tfvcClient : Tfs_Tfvc_Client.TfvcHttpClient2_3;
    constructor() {
                    this.vsoContext = VSS.getWebContext();

            this.witClient = Tfs_Wit_Client.getClient();
            this.coreClient = Tfs_Core_Client.getClient();
            this.gitClient = Tfs_Git_Client.getClient();
            this.tfvcClient = Tfs_Tfvc_Client.getClient();
    }

    getRelationTypes (callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getRelationTypes().then(function(linkTypes) { callback(linkTypes); });
        };
        getProjectInfo (callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.coreClient.getProject(self.vsoContext.project.id, true, false).then(function (projectInfo) { callback(projectInfo); });
        };
        getWorkItem (id, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItem(id, ["System.Id", "System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function (wit) { callback(wit); });
        };

        getWorkItemWithLinks (id, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItem(id, null, null, Tfs_Wit_Contracts.WorkItemExpand.Relations).then(function (wit) { callback(wit); });
        };

        getChangesetDetails (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangeset(id, null, null, true).then(function (cs) { callback(cs, callbackData); });
        };

        getCommitDetails (commitId, repo, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }

            self.gitClient.getCommit(commitId, repo).then(function (cs) { callback(cs, callbackData); });
        };

        getPullRequestDetails (pullRequestId, repo, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            //TODO REMOVEIPromise < Contracts.GitPullRequest > getPullRequest(repositoryId, pullRequestId, project, maxCommentLength, skip, top, includeCommits, includeWorkItemRefs)

            self.gitClient.getPullRequest(repo, pullRequestId).then(function (cs) { callback(cs, callbackData); });
        };


        getChangesetWorkitems (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangesetWorkItems(id).then(function (wits) { callback(wits, callbackData); });
        };

        getChangesetChanges (id, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.tfvcClient.getChangesetChanges(id).then(function (changes) { callback(changes, callbackData); });
        };

        getCommitChanges (data, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.gitClient.getChanges(data.id, data.repo, null, 100).then(function (commit) { callback(commit, data); });
        };

        getPullRequestLinks (data, callback) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.gitClient.getPullRequest(data.repo.id, data.id).then(function (pr) { callback(pr); });
        };

        getWorkItems (workItemIdArray, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            self.witClient.getWorkItems(workItemIdArray, ["System.Title", "System.WorkItemType", "System.State", "System.AssignedTo"]).then(function (wits) { callback(wits, callbackData); });
        };

        getGitFileLinks (repo, path, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            let criteria = new GitSearchCriteria(); 
            criteria.itemPath = path;
            self.gitClient.getCommits(repo, criteria).then(function (commits) { callback(commits, callbackData); });
        };

        getTfvcFileLinks (path, callback, callbackData) {
            var self = this;
            if (callback === undefined) {
                throw new Error("This method requires a callback function.");
            }
            let criteria = new TfvcSearchCriteria();
            criteria.itemPath = path;
            //Default values from https://www.visualstudio.com/sv-se/docs/integrate/api/tfvc/changesets
            self.tfvcClient.getChangesets(self.vsoContext.project.id, 80, 0, 100, "id desc", criteria).then(function (changesets) { callback(changesets, callbackData); });
        };
}

class TfvcSearchCriteria implements Tfs_Vc_Contracts.TfvcChangesetSearchCriteria
{
        /**
     * Alias or display name of user who made the changes
     */
    author: string;
    /**
     * Whether or not to follow renames for the given item being queried
     */
    followRenames: boolean;
    /**
     * If provided, only include changesets created after this date (string) Think of a better name for this.
     */
    fromDate: string;
    /**
     * If provided, only include changesets after this changesetID
     */
    fromId: number;
    /**
     * Whether to include the _links field on the shallow references
     */
    includeLinks: boolean;
    /**
     * Path of item to search under
     */
    itemPath: string;
    /**
     * If provided, only include changesets created before this date (string) Think of a better name for this.
     */
    toDate: string;
    /**
     * If provided, a version descriptor for the latest change list to include
     */
    toId: number;
}

class GitSearchCriteria implements Tfs_Vc_Contracts.GitQueryCommitsCriteria
{
        /**
     * Number of entries to skip
     */
    $skip: number;
    /**
     * Maximum number of entries to retrieve
     */
    $top: number;
    /**
     * Alias or display name of the author
     */
    author: string;
    /**
     * If provided, the earliest commit in the graph to search
     */
    compareVersion: Tfs_Vc_Contracts.GitVersionDescriptor;
    /**
     * If true, don't include delete history entries
     */
    excludeDeletes: boolean;
    /**
     * If provided, a lower bound for filtering commits alphabetically
     */
    fromCommitId: string;
    /**
     * If provided, only include history entries created after this date (string)
     */
    fromDate: string;
    /**
     * If provided, specifies the exact commit ids of the commits to fetch. May not be combined with other parameters.
     */
    ids: string[];
    /**
     * Whether to include the _links field on the shallow references
     */
    includeLinks: boolean;
    /**
     * Whether to include linked work items
     */
    includeWorkItems: boolean;
    /**
     * Path of item to search under
     */
    itemPath: string;
    /**
     * If provided, identifies the commit or branch to search
     */
    itemVersion: Tfs_Vc_Contracts.GitVersionDescriptor;
    /**
     * If provided, an upper bound for filtering commits alphabetically
     */
    toCommitId: string;
    /**
     * If provided, only include history entries created before this date (string)
     */
    toDate: string;
    /**
     * Alias or display name of the committer
     */
    user: string;
}
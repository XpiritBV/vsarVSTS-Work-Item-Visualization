/*---------------------------------------------------------------------
// <copyright file="Common.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. Some common types.
 //  </summary>
//---------------------------------------------------------------------*/

export enum FilterTypes {
    All,
    WorkItemOnly,
    WorkItemWithChanges,
    WorkItemWithChangesAndFiles
}

export class Categories {
    static Annotation = "Annotation";
    static File = "File";
    static Commit ="Commit";
    static Changeset="Changeset"; 
    static PullRequest = "Pull Request";
    static WorkItem = "Work Item";
}
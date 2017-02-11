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
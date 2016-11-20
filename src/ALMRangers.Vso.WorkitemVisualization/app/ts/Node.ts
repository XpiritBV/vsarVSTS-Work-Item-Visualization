import * as NodeTemplate from "./NodeTemplate"

class GraphItem<T> {
    public group : string;
    public data : T;
}

abstract class NodeData {
    public id: string;
    public origId: string;
    public category: string;
    public content: string;
    public bgImage: string;
}

class WorkitemNodeData extends NodeData {
    public title: string;
    public url: string;
    public workItemType: string;
    public state: string;
    public assignedTo: string;
}

class ChangesetNodeData extends NodeData {
    public url: string;
    public author: string;
    public comment: string;
    public createdDate: string;
}

class PRNodeData extends NodeData {
    public url: string;
    public author: string;
    public comment: string;
    public createdDate: string;
    public repo: string;
}

class CommitNodeData extends NodeData {
    public url: string;
    public author: string;
    public comment: string;
    public createdDate: string;
    public repo: string;
    public shortId: string;
}

class CsFileNodeData extends NodeData {
    public changesetId: string;
    public objectType: string;
    public file: string;
    public changeType: string;
}

class CommitFileNodeData extends NodeData {
    public objectType: string;
    public file: string;
    public changeType: string;
    public repo: string;
    public commitId: string;
    public path: string;
}

class NoteNodeData extends NodeData
{
    public title : string;
    public size : string;
    public shapeType : string;
    public linkedToId : string;
}

class EdgeData {
    public id: string;
    public source: string;
    public target: string;
    public name: string;
}

//TODO: We could have separate factory implementations per type of nodedata type. currently code has been moved just.
class NodeDataFactory {

    private _nodeTempladeFactory : NodeTemplate.NodeTemplateFactory;
    /**
     *
     */
    constructor() {
        this._nodeTempladeFactory = new NodeTemplate.NodeTemplateFactory();
    }

    createWitNodeData(wit) : GraphItem<WorkitemNodeData> {
        var assigned = "";
        if (wit.fields["System.AssignedTo"] != null) {
            assigned = wit.fields["System.AssignedTo"].replace(/<.*>/i, " ");
        }
        var witState = wit.fields["System.State"];
        var witType = wit.fields["System.WorkItemType"];
        var title = wit.fields["System.Title"];
        var witText = this._nodeTempladeFactory.getWitText(wit.id, title, witState, witType, assigned);
        var newNode : WorkitemNodeData = {
            id: "W" + wit.id,
            origId: wit.id,
            category: "Work Item",
            content: witText,
            title: title,
            state: witState,
            workItemType: witType,
            bgImage: this._nodeTempladeFactory.getWitBackground(witType, witText, undefined, undefined, undefined),
            assignedTo: assigned,
            url: wit.url
        };
        return { group: 'nodes', data: newNode };
    }

    createChangesetNodeData(cs) : GraphItem<ChangesetNodeData> {
        var category = "Changeset";
        var d = new Date(cs.createdDate);
        var cardText = this._nodeTempladeFactory.getArtifactText(category, cs.changesetId, d.toLocaleString(), cs.author.displayName);
        var newNode : ChangesetNodeData = {
            id: "C" + cs.changesetId,
            origId: cs.changesetId,
            category: category,
            content: cardText,
            bgImage: this._nodeTempladeFactory.getArtifactBackground(category, cardText, undefined, undefined, undefined),
            author: cs.author.displayName,
            createdDate: d.toLocaleString(),
            comment: cs.comment,
            url: cs.url
        }
        return { group: 'nodes', data: newNode };
    }

    createPullRequestNodeData(pr) : GraphItem<PRNodeData> {
        var category = "Pull Request";
        var d = new Date(pr.creationDate);
        var cardText = this._nodeTempladeFactory.getArtifactText(category, pr.pullRequestId, d.toLocaleString(), pr.createdBy.displayName);
        var newNode : PRNodeData = {
            id: "P" + pr.pullRequestId,
            origId: pr.pullRequestId,
            category: category,
            content: cardText,
            bgImage: this._nodeTempladeFactory.getArtifactBackground(category, cardText, undefined, undefined, undefined),
            author: pr.createdBy.displayName,
            createdDate: d.toLocaleString(),
            repo: pr.repository,
            url: pr.url,
            comment: ""
        }
        return { group: 'nodes', data: newNode };
    }

    createCommitNodeData(commit, repo) : GraphItem<CommitNodeData> {
        var category = "Commit";
        var d = new Date(commit.author.date);
        var cardText = this._nodeTempladeFactory.getArtifactText(category, commit.commitId.substring(0, 8), d.toLocaleString(), commit.author.name);
        var newNode : CommitNodeData = {
            id: "G" + commit.commitId,
            origId: commit.commitId,
            repo: repo,
            category: category,
            content: cardText,
            shortId: commit.commitId.substring(0, 8) + "...",
            bgImage: this._nodeTempladeFactory.getArtifactBackground(category, cardText, undefined, undefined, undefined),
            author: commit.author.name,
            createdDate: d.toLocaleString(),
            comment: commit.comment,
            url: commit.remoteUrl
        }
        return { group: 'nodes', data: newNode };
    }

    createFileNodeData(change, changesetId) : GraphItem<CsFileNodeData> {
        var category = "File";
        var fileName = change.item.path.substring(change.item.path.lastIndexOf('/') + 1);
        var find = '[/$]';
        var re = new RegExp(find, 'g');
        var fileKey = "F" + change.item.path.replace(re, "");
        //Create the node
        var cardText = this._nodeTempladeFactory.getArtifactText(category, fileName, change.changeType, "");
        var newNode : CsFileNodeData = {
            id: fileKey,
            origId: change.item.path,
            changesetId: changesetId,
            category: category,
            objectType: "File",
            file: fileName,
            changeType: change.changeType,
            bgImage: this._nodeTempladeFactory.getArtifactBackground(category, cardText, undefined, undefined, undefined),
            content: cardText
        };

        return { group: 'nodes', data: newNode };
    }

    createCommitFileNodeData(change, data) : GraphItem<CommitFileNodeData>{
        var category = "File";
        var fileName = change.item.path.substring(change.item.path.lastIndexOf('/') + 1);
        var find = '[/$]';
        var re = new RegExp(find, 'g');
        var fileKey = "F" + change.item.path.replace(re, "");
        var cardText = this._nodeTempladeFactory.getArtifactText(category, fileName, change.changeType, "");
        //Create the node
        var newNode : CommitFileNodeData = {
            id: fileKey,
            origId: change.item.url,
            repo: data.repo,
            commitId: data.id,
            category: category,
            objectType: change.item.gitObjectType,
            file: fileName,
            path: change.item.path,
            changeType: change.changeType,
            bgImage: this._nodeTempladeFactory.getArtifactBackground(category, cardText, undefined, undefined, undefined),
            content: cardText
        };

        return { group: 'nodes', data: newNode };
    }

    createNoteData(id, title, txt, shapeType, size, backgroundColor, linkedtoId) : GraphItem<NoteNodeData> {

        backgroundColor = "#FFFFFF";
        var borderColor = "#FFFFFF";

        var newNode : NoteNodeData = {
            id: "Note" + id,
            origId: id,
            title: title,
            category: "Annotation",
            content: txt,
            size: size,
            shapeType: shapeType,
            linkedToId: linkedtoId,
            bgImage: this._nodeTempladeFactory.getNoteBackground(title, txt, shapeType, size, backgroundColor, borderColor, undefined),
        };

        return { group: 'nodes', data: newNode };
    }

    createNodeEdgeData(source, target, name) : GraphItem<EdgeData> {
        return {
            group: 'edges',
            data: {
                id: source + "-" + target,
                source: source,
                target: target,
                name: name
            }
        };
    }
}

export { NodeData, WorkitemNodeData, CommitNodeData, CommitFileNodeData, ChangesetNodeData, CsFileNodeData, EdgeData, PRNodeData, NodeDataFactory };
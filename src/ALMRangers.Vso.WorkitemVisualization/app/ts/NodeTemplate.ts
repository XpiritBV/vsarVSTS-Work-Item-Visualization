/*---------------------------------------------------------------------
// <copyright file="NodeTemplate.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. Node templates.
 //  </summary>
//---------------------------------------------------------------------*/


declare function unescape(s: string): string;

//TODO: We could have separate factory implementations per type of node e.g. wit, note, artifact 
class NodeTemplateFactory {

    private defaultBackgroundColor = "#fff";
    private defaultBorderColor = "#000";
    private defaultTextColor = "#000";

    xmlSafe = (text): string => {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    private witTemplate = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="80"><path fill="backgroundColor" stroke="borderColor" d="M0 0h210v80H0z"/><path fill="witColor" d="M0 0h6v80H0z"/>textTemplate</svg>';
    private witTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">textId</tspan><tspan x="76">textTitle1</tspan>  <tspan x="16" dy="16">textTitle2</tspan>  <tspan x="16" dy="16">textAssignedTo</tspan> <tspan x="16" dy="16">textState</tspan></text>';
    getWitBackground(type, cardText, backgroundColor, borderColor, textColor) {
        if (backgroundColor == undefined) backgroundColor = this.defaultBackgroundColor;
        if (borderColor == undefined) borderColor = this.defaultBorderColor;
        if (textColor == undefined) textColor = this.defaultTextColor;

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
            case "Requirement":
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
            case "Change Request":
                witColor = "#FF9D00";
                break;
            case "Review":
                witColor = "#FF9D00";
                break;
            case "Risk":
                witColor = "#FF9D00";
                break;
            default:
                witColor = "#F2CB1D";
        }

        var witBg = this.witTemplate.replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
            .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/witColor/g, witColor);

        if (window.btoa) {
            //To make sure all UTF8 characters work
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(witBg)));
        } else {
            return "";
        }
    }

    getWitText(id, title, state, type, assignedTo) {
        //Currently 2 lines supprted,  later on will make the node size dynamic (with min defined) and then can show all of it
        var trim = (str): string => {
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
        title = this.xmlSafe(title);
        assignedTo = this.xmlSafe(assignedTo);

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

        var witText = this.witTextTemplate.replace(/textTitle1/g, lines[0]).replace(/textTitle2/g, lines.length > 1 ? lines[1] : "")
            .replace(/textAssignedTo/g, assignedTo).replace(/textState/g, state)
            .replace(/textId/g, id);

        return witText;
    }

    private artifactTemplate = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="80"><path fill="backgroundColor" stroke="borderColor" d="M0 0h210v80H0z"/><path fill="cardColor" d="M0 0h6v80H0z"/>textTemplate</svg>';
    private artifactTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">artifactType</tspan> <tspan x="16" dy="16">artifactId</tspan> <tspan x="16" dy="16">artifactDate</tspan> <tspan x="16" dy="16">artifactAssignedTo</tspan></text>';
    getArtifactBackground(type, cardText, backgroundColor, borderColor, textColor) {
        if (backgroundColor == undefined) backgroundColor = this.defaultBackgroundColor;
        if (borderColor == undefined) borderColor = this.defaultBorderColor;
        if (textColor == undefined) textColor = this.defaultTextColor;

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


        var cardBg = this.artifactTemplate.replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
            .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/cardColor/g, cardColor);

        if (window.btoa) {
            //To make sure all UTF8 characters work
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(cardBg)));
        } else {
            //For IE9 and below
            return "";
        }
    }

    getArtifactText(type, artifactId, createdDate, assignedTo) {
        assignedTo = this.xmlSafe(assignedTo);
        var cardText = this.artifactTextTemplate.replace(/artifactType/g, type).replace(/artifactId/g, artifactId)
            .replace(/artifactDate/g, createdDate).replace(/artifactAssignedTo/g, assignedTo);

        return cardText;
    }

    private template_Yellow_NOTE_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path fill="#ffffa5" stroke="borderColor" d="M0 0h210v80H0z"/>textTemplate</svg>';
    private template_Red_NOTE_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path fill="#FFC0CB" stroke="RED" d="M0 0h210v80H0z"/>textTemplate</svg>';
    private template_Red_Arrow_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="pink" stroke="red" />textTemplate</svg>';
    private template_Yellow_Arrow_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="#ffffa5" stroke="black" />textTemplate</svg>';
    private template_Green_Arrow_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" viewBox="0 0 210 80"><path d="M 0,0L 180,0 L 210,40 L 180,80 L 0,80 L 0,0 z" fill="#00CC00" stroke="green" />textTemplate</svg>';

    private template_TEXT_Background = '<svg xmlns="http://www.w3.org/2000/svg" width="size-width" height="size-height" ><path fill="#fff" stroke="#fff" d="M0 0h210v80H0z"/>textTemplate</svg>';

    private noteTextTemplate = '<text y="20" font-size="12px" font-family="Segoe UI,Tahoma,Arial,Verdana" fill="textColor"><tspan x="16" font-weight="bold">noteTitle</tspan> <tspan x="16" dy="16">noteText</tspan></text>';
//TODO: could use enums for shape types
    getNoteTemplate = (shapeType) => {
        switch (shapeType) {
            case "Text":
                return this.template_TEXT_Background;
            case "Red Note":
                return this.template_Red_NOTE_Background;
            case "Yellow Note":
                return this.template_Yellow_NOTE_Background;
            case "Yellow Arrow":
                return this.template_Yellow_Arrow_Background;
            case "Red Arrow":
                return this.template_Red_Arrow_Background;
            case "Green Arrow":
                return this.template_Green_Arrow_Background;
        }
    }

//TODO: Could use enums for sizes
    getAnnotationSize = (sizeTxt): ISize => {
        switch (sizeTxt) {
            case "Small":
                return { width: 210, height: 80 };
            case "Medium":
                return { width: 300, height: 120 };
            case "Large":
                return { width: 400, height: 160 };
        }

    }

    getNoteBackground(title, text, shapeType, sizeTxt, backgroundColor, borderColor, textColor) {
        if (backgroundColor == undefined) backgroundColor = this.defaultBackgroundColor;
        if (borderColor == undefined) borderColor = this.defaultBorderColor;
        if (textColor == undefined) textColor = this.defaultTextColor;



        var cardText = this.noteTextTemplate.replace(/noteTitle/g, title).replace(/noteText/g, text);
        var cardBg;
        var size = this.getAnnotationSize(sizeTxt);
        cardBg = this.getNoteTemplate(shapeType).replace(/backgroundColor/g, backgroundColor).replace(/borderColor/g, borderColor)
            .replace(/textTemplate/g, cardText).replace(/textColor/g, textColor).replace(/cardColor/g, backgroundColor)
            .replace(/size-width/g, size.width.toString()).replace(/size-height/g, size.height.toString());



        if (window.btoa) {
            //To make sure all UTF8 characters work
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(cardBg)));
        } else {
            //For IE9 and below
            return "";
        }
    }
}

interface ISize {
    width: number;
    height: number;
}

export { NodeTemplateFactory }
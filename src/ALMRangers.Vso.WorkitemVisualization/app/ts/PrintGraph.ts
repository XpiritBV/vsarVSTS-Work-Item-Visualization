/*---------------------------------------------------------------------
// <copyright file="PrintGraph.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The application logic for finding work item by id dialog view.
 //  </summary>
//---------------------------------------------------------------------*/

import Dialogs = require("VSS/Controls/Dialogs");

// export class PrintGraph {

//     static showPrintGraphForm(img: string, witType: string, witId: string) {

//         var self = this;

//         var extensionContext = VSS.getExtensionContext();

//         var dlgContent = $("#createPrintGraphDlg").clone();


//         var d = new Date();
//         dlgContent.find("#printTitle").text("Visualization of " + witType + " " + witId);
//         dlgContent.find("#printDateTime").text("Generated " + d.toLocaleDateString());
//         dlgContent.find("#graphImage").attr("src", img);

//         dlgContent.show();
//         var opts = {
//             width: window.screen.width,
//             height: window.screen.height,
//             title: "Export Work Item Visualization",
//             buttons: null,
//             content: dlgContent
//         };

//         var dialog = Dialogs.show(Dialogs.ModalDialog, opts);
//     }
// }

export class PrintGraph extends Dialogs.ModalDialog {
    constructor(context: any) {
        super(context);
    }

    start(img: string, witType: string, witId: number) {
        var d = new Date();

        $("#printTitle").text("Visualization of " + witType + " " + witId + " | Generated "+ d.toLocaleDateString());
        $("#printInstruction").text("Instruction: Right Click on Image + Save Picture OR Right Click + Print");

        //Calculate size based on real image and windows inner size subtracting header sizes
        var headerSize = 33+24+21;//Text sizes from header to discount from height
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight-headerSize;

        //Getting real image size based on in-memory
        var realWidth, realHeight;
        $("<img />").attr("src", img).load(function () {
            realHeight = this.height;
            realWidth = this.width;

            var newWidth:number, newHeight:number;

            if (realWidth > windowWidth) {
                newWidth = windowWidth;
                newHeight = realHeight * windowWidth / realWidth;
            }
            else if (realHeight > windowHeight) {
                newHeight = windowHeight;
                newWidth = realWidth * windowHeight / realHeight;
            }

            $("#graphImage").attr("src", img).height(newHeight).width(newWidth);
        });




    }
}
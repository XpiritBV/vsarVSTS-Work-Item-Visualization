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

export class PrintGraph extends Dialogs.ModalDialog {
    constructor(context: any) {
        super(context);
    }

    start(img: string, witType: string, witId: number) {
        var d = new Date();

        $("#printTitle").text("Visualization of " + witType + " " + witId);
        $("#printDateTime").text("Generated " + d.toLocaleDateString());
        $("#graphImage").attr("src", img);
    }
}
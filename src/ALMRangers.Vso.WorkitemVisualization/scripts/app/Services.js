/*---------------------------------------------------------------------
// <copyright file="StateModelVisualization.js">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. Useful and common service classes such as MessageService.
 //  </summary>
//---------------------------------------------------------------------*/

define(["require", "exports", "VSS/Controls", "VSS/Controls/Common"],
function (require, exports, Controls, CommonControls) {
    var messageService = (function () {
        function messageService() {
        }
        messageService.prototype.displayMessage = function (message, messageType) {
            var dlg = Controls.create(CommonControls.MessageAreaControl, $("#message"), null);
            dlg.setMessage(message, messageType);
            this.messenger = dlg;
        };
        messageService.prototype.closeMessage = function () {
            this.messenger.hideElement();
        };
        return messageService;
    })();
    exports.messageService = messageService;
});
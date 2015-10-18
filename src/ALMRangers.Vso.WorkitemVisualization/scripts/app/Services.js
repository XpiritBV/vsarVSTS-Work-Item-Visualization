define(["require", "exports","VSS/Controls", "VSS/Controls/Common"],
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
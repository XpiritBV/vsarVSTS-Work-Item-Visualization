/*---------------------------------------------------------------------
// <copyright file="FavoritesDialogs.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. The add and remove favorite dialog logic.
 //  </summary>
//---------------------------------------------------------------------*/

import Controls = require("VSS/Controls")
import CboControls = require("VSS/Controls/Combos")
import Dialogs = require("VSS/Controls/Dialogs")

import * as TelemetryClient from "./TelemetryClient"

//TODO: In the future could have one dialog for managing
export class FavoritesDialogs {
    static showAddFavoriteDialog(favoritesList : Array<string>, saveFavoriteCallback) {
        //TODO: Should remame this event telemtry?
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.showSaveSharedVisualisationDialog");
        var self = this;

        var extensionContext = VSS.getExtensionContext();

        var dlgContent = $("#createFavoriteDlg").clone();
        dlgContent.show();

        var cboSavedVisualizationsOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: true,
            source: favoritesList
        };
        var cboSavedVisualizations = Controls.create(CboControls.Combo, dlgContent.find("#cboFavoritesToSave"), cboSavedVisualizationsOptions);

        var options = {
            width: 300,
            height: 150,
            cancelText: "Cancel",
            okText: "Save",
            title: "Save visualization",
            content: dlgContent,
            okCallback: function(result) {
                var currentText = cboSavedVisualizations.getText();                
                //var name = (dlgContent.find("#FavoriteName")[0] as HTMLInputElement).value;

                if (currentText)
                {
                    saveFavoriteCallback(currentText);
                }
                // else {
                //     TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.InvalidDataNoSave");
                // }                
            }
        };
//
        var dialog = Dialogs.show(Dialogs.ModalDialog, options);
        dialog.updateOkButton(true);
        dialog.setDialogResult(true);
    }

    static showDeleteFavoriteDialog(favoritesList : Array<string>, removeFavoriteCallback) {
        //TODO: Should remame this event telemtry?
        TelemetryClient.TelemetryClient.getClient().trackEvent("MainMenu.showRemoveSavedVisualisationDialog");
        var self = this;
        var dialog;

        var extensionContext = VSS.getExtensionContext();

        var dlgContent = $("#deleteFavoriteDlg").clone();
        dlgContent.show();
        
       var cboSavedVisualizationsOptions: CboControls.IComboOptions = {
            mode: "drop",
            allowEdit: false,
            source: favoritesList,
            indexChanged: function (index: number) {
                dialog.updateOkButton(true);
                dialog.setDialogResult(true);
            }
        };
        var cboSavedVisualizations = Controls.create(CboControls.Combo, dlgContent.find("#cboFavoritesToDelete"), cboSavedVisualizationsOptions);

        var options = {
            width: 300,
            height: 150,
            cancelText: "Cancel",
            okText: "Remove",
            title: "Remove saved visualization",
            content: dlgContent,
            okCallback: function(result) {                
                var selectedFavorite = cboSavedVisualizations.getText();

                if (selectedFavorite)
                {
                    removeFavoriteCallback(selectedFavorite);
                }
                // else {
                //     TelemetryClient.TelemetryClient.getClient().trackEvent("AddEditHighlightDialog.InvalidDataNoSave");
                // }                
            }
        };

        dialog = Dialogs.show(Dialogs.ModalDialog, options);
        dialog.updateOkButton(false);
    }
}
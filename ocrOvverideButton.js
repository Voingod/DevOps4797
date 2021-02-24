function OvverideDeacivateButtonOnHome(param1, param2, param3) {
    let confirmStrings = {
        title: "Achtung: Sie deaktiveren den Vorgang!",
        text: "Damit wird das hinterlegte Dokument auch gelöscht und ist nicht mehr im Fahrzeug ersichtlich!",
        confirmButtonLabel: "Vorgang löschen",
        cancelButtonLabel: "abbrechen"
    };
    Xrm.Navigation.openConfirmDialog(confirmStrings, null).then(
        function (success) {
            if (success.confirmed)
                XrmCore.Commands.Deactivate.deactivateRecords(param1, param2, param3);
        });
}

function OvverideDeacivateButtonOnForm(param1, param2, ocrId) {

    //100000000 - Irrläufer
    //100000004 - In Eingangsrechnung verschoben
    debugger;
    let statusBearbeitung = Xrm.Page.getAttribute("new_status_bearbeitung").getValue();
    // if (statusBearbeitung != 100000000 || statusBearbeitung != 100000004) {
    //     //XrmCore.Commands.Deactivate.deactivatePrimaryRecord(param1, param2);
    //     return;
    // }
    let fetch = '<fetch returntotalrecordcount="true">' +
        '<entity name="uds_document_recognition">' +
        '<link-entity name="uds_uds_document_recognition_new_fuhrpark" from="uds_document_recognitionid" to="uds_document_recognitionid" intersect="true">' +
        '<filter>' +
        '<condition attribute="uds_document_recognitionid" operator="eq" value="' + ocrId + '" />' +
        '</filter>' +
        '</link-entity>' +
        '</entity>' +
        '</fetch>';
    let url = "/uds_document_recognitions?fetchXml=" + fetch;
    let entity = Xrm.Page.data.entity;
    //let result = getReleatedEntitiesWithFuhrpark("GET", url, null,false);
    var data = { "Value": ocrId.replace('{', '').replace('}', '') };
    let result = CallAction("GET", data, url, false)
    // if (result["@odata.count"] < 2) {
    //     //XrmCore.Commands.Deactivate.deactivatePrimaryRecord(param1, param2);
    //     return;
    // }

    let confirmStrings = {
        title: "Achtung: Der Status wurde auf \"Irrläufer\" oder \"In Eingangsrechnung verschoben\" gesetzt!",
        text: "Damit wird das hinterlegte Dokument gelöscht und ist nicht mehr hinter den Fahrzeugen ersichtlich!",
        confirmButtonLabel: "verstanden",
        cancelButtonLabel: "abbrechen"
    };
    let confirmOptions = { height: 200, width: 725 };
    Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
        function (success) {
            if (success.confirmed) {
                let deleteFilesActionUrl = "/uds_document_recognitions(" + ocrId.replace('{', '').replace('}', '') + ")/Microsoft.Dynamics.CRM.uds_DeleteFilesFromFuhrparkAction";
                //getReleatedEntitiesWithFuhrpark("POST", deleteFilesActionUrl, data,true);
                var data = { "Value": ocrId.replace('{', '').replace('}', '') };
                CallAction("POST", data, deleteFilesActionUrl, true);
                return;
                XrmCore.Commands.Deactivate.deactivatePrimaryRecord(param1, param2);
            }
        });
}

function CallAction(method, dataPass, url, sync) {
    const version = window.parent.Xrm.Page.context.getVersion();
    const apiUrl = window.parent.Xrm.Page.context.getClientUrl() + "/api/data/v" + version.slice(0, version.indexOf(".") + 2);
    

    let req = new XMLHttpRequest();
    let data ={};
    req.open(method, apiUrl + url, sync);

    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {
        if (this.readyState == 4) {
            req.onreadystatechange = null;
            if (this.status == 200 || this.status == 204) {
                data = JSON.parse(this.response);
                console.log(data);   
            }
            else{
                Xrm.Navigation.openAlertDialog(error.message)

            }
        }
    };

    req.send(window.JSON.stringify(dataPass));
    return data;
}
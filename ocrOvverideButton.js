function OvverideDeacivateButtonOnHome(SelectedControlSelectedItemReferences) {
    let confirmStrings = {
        title: "Achtung: Sie deaktiveren den Vorgang!",
        text: "Damit wird das hinterlegte Dokument auch gelöscht und ist nicht mehr im Fahrzeug ersichtlich!",
        confirmButtonLabel: "Vorgang löschen",
        cancelButtonLabel: "abbrechen"
    };
    Xrm.Navigation.openConfirmDialog(confirmStrings, null).then(
        function (success) {
            if (success.confirmed)
                DeactivateOCR(SelectedControlSelectedItemReferences, null);
        });
}

function OvverideDeacivateButtonOnForm() {

    //100000000 - Irrläufer
    //100000004 - In Eingangsrechnung verschoben
    debugger;
    let ocrId = Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');
    let statusBearbeitung = Xrm.Page.getAttribute("new_status_bearbeitung").getValue();
    let data = { "Value": ocrId.replace('{', '').replace('}', '') };
    //let entityStatusCode = { statuscode: 2, statecode: 1 };

    let OCREntity = { entityType: "uds_document_recognition", id: Xrm.Page.data.entity.getId() };

    if (statusBearbeitung != 100000000 && statusBearbeitung != 100000004) {
        DeactivateOCR(null, OCREntity)
        //CallAction("PATCH", entityStatusCode, "/uds_document_recognitions(" + ocrId + ")", true);
        //parent.window.location.reload();
        return;
    }
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

    let result = CallAction("GET", data, url, false)
    if (result["@odata.count"] < 2) {
        //CallAction("PATCH", entityStatusCode, "/uds_document_recognitions(" + ocrId + ")", true);
        DeactivateOCR(null, OCREntity)
        //parent.window.location.reload();
        return;
    }

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
                //let deleteFilesActionUrl = "/uds_document_recognitions(" + ocrId + ")/Microsoft.Dynamics.CRM.uds_DeleteFilesFromFuhrparkAction";
                //CallAction("POST", data, deleteFilesActionUrl, true);
                //CallAction("PATCH", entityStatusCode, "/uds_document_recognitions(" + ocrId + ")", true);
                DeactivateOCR(null, OCREntity)
                //parent.window.location.reload();
            }
        });
}

function CallAction(method, dataPass, url, sync) {
    const version = window.parent.Xrm.Page.context.getVersion();
    const apiUrl = window.parent.Xrm.Page.context.getClientUrl() + "/api/data/v" + version.slice(0, version.indexOf(".") + 2);
    Xrm.Utility.showProgressIndicator('Verarbeiten...');
    let req = new XMLHttpRequest();
    let data = {};
    req.open(method, apiUrl + url, sync);

    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {
        if (this.readyState == 4) {
            parent.window.Xrm.Utility.closeProgressIndicator();
            req.onreadystatechange = null;
            if (this.status == 200) {
                data = JSON.parse(this.response);
                console.log(data);
            }
            else if (this.status == 204) {
            }
            else {
                Xrm.Navigation.openAlertDialog(this.message)
            }
        }
    };

    req.send(window.JSON.stringify(dataPass));
    return data;
}


function DeactivateOCR(SelectedControlSelectedItemReferences, OCREntity) {
    Xrm.Utility.showProgressIndicator('Verarbeiten...');
    let Sdk = window.Sdk || {};
    Sdk.Deactivate = function (OCRCollections, OCREntity) {
        this.OCRCollections = OCRCollections;
        this.OCREntity = OCREntity;
    };

    Sdk.Deactivate.prototype.getMetadata = function () {
        return {
            boundParameter: null,
            parameterTypes: {
                "OCRCollections": { // entity collection
                    typeName: "Collection(mscrm.crmbaseentity)",
                    structuralProperty: 4 // collection type
                },
                "OCREntity": { // entity
                    typeName: "mscrm.uds_document_recognition",
                    structuralProperty: 5
                }
            },
            operationType: 0,
            operationName: "uds_DeleteFilesFromFuhrparkAction"
        }
    };
    let arr = [];
    let deactivateRequest;
    if (SelectedControlSelectedItemReferences != null) {
        for (let i = 0; i < SelectedControlSelectedItemReferences.length; i++) {
            let obj = {};
            obj.entityType = SelectedControlSelectedItemReferences[i].TypeName;
            obj.id = SelectedControlSelectedItemReferences[i].Id;
            arr.push(obj);
        }
        deactivateRequest = new Sdk.Deactivate(arr, OCREntity)
    }
    else {
        deactivateRequest = new Sdk.Deactivate(null, OCREntity)
    }

    Xrm.WebApi.online.execute(deactivateRequest).then(
        function (response) {
            parent.window.Xrm.Utility.closeProgressIndicator();
            if (response.ok) {
                parent.window.location.reload();
            }
        },
        function (error) {
            parent.window.Xrm.Utility.closeProgressIndicator();
            console.log(error.message);
        }
    );
}
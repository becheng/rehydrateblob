const { BlobServiceClient, ContainerClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");
const util = require("util");

module.exports = async function (context, eventGridEvent) {
    context.log(JSON.stringify(eventGridEvent));

    const eventData = eventGridEvent.data;
    const eventBlobUrl = eventData.url;
    //const eventApi = eventData.api;
    const eventType = eventGridEvent.eventType;
    const eventDetails = `Blob url: ${eventBlobUrl} re-hydrated using eventType: ${eventType} on ${eventGridEvent.eventTime}`
    console.log(eventDetails);

    context.bindings.message = {
        subject: util.format('[Do not reply] Your file is ready for download'),
        personalizations: [ { "to": [ {"email": "ben.cheng@microsoft.com" } ] } ],
        content: [{
            type: 'text/plain',
            value: util.format(eventDetails)
        }]
    };

};
const { BlobServiceClient, ContainerClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, eventGridEvent) {
    context.log(JSON.stringify(eventGridEvent));

    // keep a log of the rehydrate blob events with a format of 'rehydratedblob-log-2021-10-15T11:46:51.txt'
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -5);
    const rehydrateAuditBlobName = `rehydratedblob-log-${localISOTime}.txt`

    // build out the audit log
    const eventData = eventGridEvent.data;
    const eventBlobUrl = eventData.url;
    //const eventApi = eventData.api;
    const eventType = eventGridEvent.eventType;
    const auditContent = `Blob url: ${eventBlobUrl} re-hydrated using eventType: ${eventType} on ${eventGridEvent.eventTime}`
    
    console.log(`auditFileName: ${rehydrateAuditBlobName}`);
    console.log(auditContent);

    // upload the audit record/blob to the storage container
    const account = process.env.ACCOUNT_NAME || "";
    const auditContainerName = process.env.AUDITLOG_CONTAINER || "";

    const defaultAzureCredential = new DefaultAzureCredential();
    
    const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`,defaultAzureCredential);
    const containerClient = blobServiceClient.getContainerClient(auditContainerName);
    
    const blockBlobClient = containerClient.getBlockBlobClient(rehydrateAuditBlobName);
    const uploadBlobResponse = await blockBlobClient.upload(auditContent, auditContent.length);
    
    console.log(`Upload audit blob ${rehydrateAuditBlobName} successfully`, uploadBlobResponse.requestId);    
};
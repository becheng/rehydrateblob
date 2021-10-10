const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {

    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    // for local development use .env file for environment variables
    // if (process.env.NODE_ENV === 'dev') {
    loadLocalEnvironmentVariables(context);
    // }

    let responseMessage; 
    const account = process.env.ACCOUNT_NAME || "";
    const muiClientId = process.env.MUI_CLIENT_ID || "";
    const containerName = process.env.CONTAINER || "";
    
    // authenticate to storage account; first if  service principal provided (for local dev), then by managed user identity 
    // const defaultAzureCredential = new DefaultAzureCredential({managedIdentityClientId: `${muiClientId}`});
    const defaultAzureCredential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`,defaultAzureCredential);
    const containerClient = blobServiceClient.getContainerClient(`${containerName}`);
    
    // list the blobs and output as arrays of object values  
    let iter = containerClient.listBlobsFlat();
    let blobItem = await iter.next();

    let blobListObj = {};  //empty object
    blobListObj['blobList'] = []; // object property of array type to hold an array of blob objects

    i = 1;
    while (!blobItem.done) {
        console.log(`Blob ${i++}: ${JSON.stringify(blobItem.value)}`);
        
        blobListObj['blobList'].push({
            name: blobItem.value.name,
            contentType: blobItem.value.properties.contentType,
            lastModified: blobItem.value.properties.lastModified.toLocaleDateString("en-CA", {hour: '2-digit', minute:'2-digit'}), 
            createdOn: blobItem.value.properties.createdOn,
            tier: blobItem.value.properties.accessTier    
        });
        blobItem = await iter.next();
    }
    responseMessage = blobListObj;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}

// helper method to load local environment variables from .env file, 
// otherwise when api deployed to Azure set the variables on the Function app 
function loadLocalEnvironmentVariables(context) {
    console.log(`...loading .env file...`);

    require("dotenv").config({path: '../.env'});

    if (
        !process.env.AZURE_TENANT_ID ||
        !process.env.AZURE_CLIENT_ID ||
        !process.env.AZURE_CLIENT_SECRET
    ) {
        let localDevWarningStr = 
            "Azure AD authentication information not provided, but it is required to run this sample locally.  Exiting."
        console.warn(localDevWarningStr);
        responseMessage = localDevWarningStr;
        context.res = {
            status: 204, //i.e 204 - no content 
            body: responseMessage
        };
    }
}
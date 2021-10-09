const { StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters} = require("@azure/storage-blob");

module.exports = async function (context, req) {

    const blobName = req.query.blobName;

    console.log(`Generating download sas uri for ${blobName}`);

    // for local development use .env file for environment variables
    if (process.env.NODE_ENV === 'dev') {
        loadLocalEnvironmentVariables(context);
    }

    const account = process.env.ACCOUNT_NAME || "";
    const accountKey = process.env.ACCOUNT_KEY || "";
    const containerName = process.env.CONTAINER_NAME || "";
        
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const sasToken = generateSasToken(containerName, blobName, sharedKeyCredential);
    const blobSasUri = `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
    
    context.res.json({
        blobSasUri: blobSasUri
    });

}

function generateSasToken(containerName, blobName, sharedKeyCredential, storedPolicyName) {
    
    const sasOptions = {
        containerName: containerName,
        blobName: blobName,
        contentDisposition: "file; attachment"
    };

    if (storedPolicyName == null) {
        sasOptions.startsOn = new Date();
        sasOptions.expiresOn = new Date(new Date().valueOf() + 3600 * 1000);
        sasOptions.permissions = BlobSASPermissions.parse("r");
    } else {
        sasOptions.identifier = storedPolicyName;
    }

    return generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
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
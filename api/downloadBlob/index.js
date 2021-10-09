const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    
    const blobName = req.query.blobName;
    console.log(`Retrieving blob ${blobName}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    // for local development use .env file for environment variables
    if (process.env.NODE_ENV === 'dev') {
        loadLocalEnvironmentVariables(context);
    }

    const account = process.env.ACCOUNT_NAME || "";
    const muiClientId = process.env.MUI_CLIENT_ID || "";
    const containerName = process.env.CONTAINER_NAME || "";
    
    // authenticate to storage account; first if  service principal provided (for local dev), then by managed user identity 
    const defaultAzureCredential = new DefaultAzureCredential({managedIdentityClientId: `${muiClientId}`});
    const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`,defaultAzureCredential);
    
    // create a client to the specific blob
    const containerClient = blobServiceClient.getContainerClient(`${containerName}`);
    const blobClient = containerClient.getBlobClient(blobName);
 
    console.log(`blob uri: ${blobClient.url}`);
    
    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    const downloadBlockBlobResponse = await blobClient.download();

    // stream the readable filestream to a buffer 
    const fileBuffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

    const fileName = `${blobName}`; //${new Date().getTime()}

    context.res = {
        status: 202,
        body: fileBuffer,
        headers: {
           "Content-Disposition": `attachment; filename=${fileName}`
        }
      };
    context.done();
}

// [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
    });
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
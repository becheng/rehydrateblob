const util = require("util");

module.exports = async function (context) {
    context.log('emailOnBlobRehydrated function triggered...');

    context.bindings.message = {
        subject: util.format('[Do not reply] Your file is ready for download'),
        personalizations: [ { "to": [ {"email": "ben.cheng@microsoft.com" } ] } ],
        content: [{
            type: 'text/plain',
            value: util.format("sample message text")
        }]
    };
}
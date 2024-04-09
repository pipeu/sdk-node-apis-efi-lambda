<h1 align="center">sdk-node-apis-efi-lambda - Fork of the Efí SDK Node.js, with less boilarplate, and to execute on AWS Lambda using serverless platform</h1>

<h2 align="center">This is not a SDK, it is a full example of how to call Efi Payment API

<h2 align="center">Stack</h2>

<p>axios implementation (inspired by Efí SDK node.js lib )</p>
<p>aws lambda</p>
<p>aws s3 (to store the file certificate)</p>
<p>serverless platform to handle and upload the aws lambda</p>
<p>lambda-api lib to create a small node api under the aws lambda using the event proxy</p>



## Config

In serverless.yml
Change YOUR_BUCKET to you AWS S3 Bucket Name:
- "arn:aws:s3:::YOUR_BUCKET/*"

Add your Efi credencials
change certificate-name.p12 by your certificate name

```js

//  On efiServices.js change the following parameters:
const options = {
    sandbox: false,
    client_id: 'your_Client_Id',
    client_secret: 'your_Client_Secret',
    certificate: '/tmp/certificate-name.p12', // put your certificate name here
}

// TODO: add your AWS credencials
AWS.config.update({
    "accessKeyId": "XYXYXYXYXYXYXYXYX",
    "secretAccessKey": "XXXXXXXXXXXXXXXXXXXXXXX"
})

// don't forget to add the file cert on your own bucket
const fileName = 'YOUR_FILE_CERTIFICATE_NAME_ON_AWS_S3_BUCKET' // TODO: CHANGE HERE

let params = {
    Bucket: 'YOUR_BUCKET_SAME_NAME_IN_serverless.yml', // TODO: CHANGE HERE
    Key:    fileName
}
```
The rest of the efiServices.js file is the normal api flow, like create a Pix charge with amount, expiration and so one.

## Deploy with Serverless platform

```bash

# dev
$ sls deploy
# tail logs
$ sls logs -f service -t

# prod
$ sls deploy --stage prod --region us-east-1
# tail logs
$ sls logs -f service -t --stage prod --region us-east-1
```


## Simple test

Get the url returned by serverless / aws lambda 
Example:
https://xyxyxyxyxy.execute-api.us-east-1.amazonaws.com/prod/
```js

# Add lambda api context (located on handler) and the api path (rest api using lambda-api), here "billing" is the context name, full example:
https://xyxyxyxyxy.execute-api.us-east-1.amazonaws.com/prod/billing/efi
```

## Full Efí Docs
https://dev.sejaefi.com.br/.


let AWS = require('aws-sdk')
const fs = require('fs')
const fsPromise = require('fs').promises
import { S3 } from 'aws-sdk/index'

const https = require('https')
const axios = require('axios')

// TODO: CHANGE HERE
const options = {
    sandbox: false,
    client_id: 'your_Client_Id',
    client_secret: 'your_Client_Secret',
    certificate: '/tmp/certificate-name.p12', // put your certificate name here
}


const { AWS_REGION_ENV_VARIABLE } = process.env

// TODO: move to aws secrets
AWS.config.update({
    "accessKeyId": "ADD_YOU_AWS_KEY_HERE", // TODO: CHANGE HERE
    "secretAccessKey": "ADD_YOUR_AWS_SECRET_KEY_HERE" // TODO: CHANGE HERE
})

let auth
let agent

function isExpired(auth) {
    let current_time = new Date().getTime() / 1000
    if (current_time > auth.authDate + auth.expires_in) {
        return true
    }
    return false
}

const DEFAULT_API = 'pix'

// oauth url
let authURL = 'https://pix.api.efipay.com.br/oauth/token'

async function authenticate() {
    let authParams = {
        method: 'POST',
        url: authURL,  // this.baseUrl + this.authRoute.route,
        headers: {
            'api-sdk': 'node-1.1.2',
        },
        data: {
            grant_type: 'client_credentials',
        },
    }
    if (DEFAULT_API == 'pix') {
        let token = Buffer.from(options.client_id + ':' + options.client_secret).toString('base64')

        authParams.headers['Authorization'] = 'Basic ' + token
        authParams.headers['Content-Type'] = 'application/json'
        authParams.httpsAgent = agent

    } else {
        authParams.auth = {
            username: options.client_id,
            password: options.client_secret,
        }
    }

    return axios(authParams)
        .then((res) => {
            console.log('return axios authenticate res.data:', res.data)
            auth = res.data
            auth.authDate = new Date().getTime() / 1000
        })
        .catch((error) => {
            throw error.data
        })
}


async function createRequest(url, body, method) {
    console.log('createRequest')

    let headers = new Object()
    headers['x-skip-mtls-checking'] = true // !this.options.validateMtls

    let req = {
        method,
        url: url,
        headers,
        data: body,
    }
    req['httpsAgent'] = agent

    let axiosInstance = axios.create()
    axiosInstance.interceptors.request.use(
        async (config) => {
            if (!auth || isExpired(auth)) {
                await authenticate()
            }
            config.headers = {
                Authorization: `Bearer ${auth.access_token}`,
                'x-skip-mtls-checking': true // !this.options.validateMtls
            }
            return config
        },
        (error) => {
            Promise.reject(error)
        },
    )

    return axiosInstance(req)
        .then((res) => {
            console.log('return axiosInstance req req.data:', req.data)
            return res.data
        })
        .catch((error) => {
            console.log('error axiosInstance error.response:', error.response)
            throw error.response.data
        })
}

export async function testEfi() {
    console.log('testEfi')

    const s3 = new S3({ region: AWS_REGION_ENV_VARIABLE })
    try {

        const fileName = 'YOUR_FILE_CERTIFICATE_NAME_ON_AWS_S3_BUCKET' // TODO: CHANGE HERE
        let params = {
            Bucket: 'YOUR_BUCKET_SAME_NAME_IN_serverless.yml', // TODO: CHANGE HERE
            Key:    fileName
        }
        const data = await s3.getObject(params).promise();
        // console.log('data from getObject', data)
        await fsPromise.writeFile('/tmp/' + fileName, data.Body);

        let body = {
            calendario: {
                expiracao: 7200,
            },
            valor: {
                original: '12.45',
            },
            chave: 'you_pix_key_here' // TODO: CHANGE HERE
        }

        let txid = 'd65480d7b502487590eb83007d70oooo' // TODO: CHANGE HERE

        try {
            agent = new https.Agent({
                pfx: fs.readFileSync(options.certificate),
                passphrase: '',
            })
        } catch (error) {
            console.log('error reading the certificate')
            throw `FALHA AO LER O CERTIFICADO, VERIFIQUE O CAMINHO INFORMADO: ${options.certificate}`
        }

        // pixCreateCharge example
        let pixUrl = 'https://pix.api.efipay.com.br' + '/v2/cob/' + txid
        let pix = await createRequest(pixUrl, body, 'PUT')
        console.log('pix:', pix)
        console.log('pix.loc:', pix.loc)
        console.log('pix.location:', pix.location)
        console.log('pix.pixCopiaECola:', pix.pixCopiaECola)

    } catch (e) {
        console.log('Error executing Efi API: ' + e.message)
        throw new Error('Error executing Efi API: ' + e.message)
    }
}

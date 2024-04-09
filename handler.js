import { testEfi } from './efiServices'

const apiVersion = 'v1.0'
const app = require('lambda-api')({
    version: apiVersion,
    base: 'billing', // change api bath here, final url will for instance: aws_api_gateway_url/prod/billing/status
    logger: {
        level: 'info', // debug
        timestamp: () => new Date().toUTCString(), // custom timestamp
        stack: true
}})


app.use((req, res, next) => {
    res.cors() // Define Middleware
    next()
})

const generateResult = (status, result) => {
    const jRes = {
        status: status,
        stage: '' + process.env.stage,
        result: result,
        version: apiVersion
    }
    return jRes
}

// API routes
app.get('/status', async (req, res) => {
    return { status: 'ok' }
})


app.get('/efi', async (req, res) => {
    console.log('/efi Received event:', JSON.stringify(req.body, null, 2))

    let event = req.body
    await testEfi()

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Credentials', 'true')
    return res.status(200).json(generateResult('ok', {})) // result
})



app.options('/*', (req, res) => {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'StoreId', 'storeid', 'Content-Type, Authorization, Content-Length, X-Requested-With')
    res.status(200).send({})
})


// ----------------------------------------------------------------------------//
// Main router handler
// ----------------------------------------------------------------------------//
// module.exports.router
export const router = async (event, context) => {
    console.log('router:' + process.env.stage)
    context.callbackWaitsForEmptyEventLoop = false
    return await app.run(event, context)
}



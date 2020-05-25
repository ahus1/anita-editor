require("dotenv").config()

const https = require("https")

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

const statusCodeOk = 200
const headers = {
    "Content-Type": "application/json"
}

exports.handler = function (event, context, callback) {
    //-- We only care to do anything if this is our POST request.
    if (event.httpMethod !== "POST" || !event.body) {
        console.error("no POST, no body")
        callback(null, {
            statusCode: 400,
            headers,
            body: `{"error":"no POST, no body"}`
        })
        return
    }

    //-- Parse the body contents into an object.
    const data = JSON.parse(event.body)

    const options = {
        hostname: "github.com",
        port: 443,
        path: `/login/oauth/access_token`,
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    }

    //-- Make sure we have all required data. Otherwise, escape.
    if (!data.code || !data.state) {
        console.error("Required information is missing.")
        callback(null, {
            statusCode: 500,
            headers,
            body: JSON.stringify({status: "missing-information"})
        })

        return
    }

    const req = https.request(options, res => {
        res.on("data", d => {
            const data = JSON.parse(d)
            callback(null, {
                statusCode: res.statusCode,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            })
        })
    })

    const request = JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        state: data.state,
        code: data.code
    })

    req.write(
        request
    )

    req.on("error", e => {
        console.error("error", e)
        callback(null, {
            statusCode: 500,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: e})
        })
    })

    req.end()

}

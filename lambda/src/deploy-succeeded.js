require("dotenv").config()

const https = require("https")

const apiToken = process.env.API_TOKEN
const chatId = process.env.CHAT_ID

const statusCodeOk = 200
const headers = {
  "Access-Control-Allow-Headers": "Content-Type"
}

exports.handler = function(event, context, callback) {
  //-- Parse the body contents into an object.
  const data = JSON.parse(event.body)

  const options = {
    hostname: "api.telegram.org",
    port: 443,
    path: `/bot${apiToken}/sendMessage?chat_id=${chatId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }

  const req = https.request(options, res => {
    res.on("data", d => {
      const data = JSON.parse(d)
      console.log(data)
      callback(null, {
        statusCode: statusCodeOk,
        headers,
        body: ""
      })
    })
  })

  // console.log(JSON.stringify(data.payload,null,2))

  req.write(
    JSON.stringify({
      text: `What: deploy succeeded
When: ${new Date().toISOString()}
Commit: ${data.payload["branch"]}/${data.payload["commit_ref"]}
Title: ${data.payload["title"]}`
    })
  )

  req.on("error", e => {
    console.error(e)
    callback(null, {
      statusCode: statusCodeOk,
      headers,
      body: ""
    })
  })

  req.end()
}

const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")

const router = require("./js/router")
const config = require("./js/config")
const license = require("./js/license")

const app = express()
app.use(express.static(path.join(__dirname, "html", "dist")))
app.use(bodyParser.json())
if (config.enableCORS) {
    app.all('*', function(request, response, next) {
        response.header("Access-Control-Allow-Origin", "*")
        response.header("Access-Control-Allow-Methods", "*")
        response.header("Access-Control-Allow-Headers", "*")
        next()
    })
}
app.use(router)

license.init()

app.listen(config.port, function() {
    console.table({
        port: config.port,
        enableCORS: config.enableCORS,
        dir: __dirname
    })
});

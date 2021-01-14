const express = require("express")
const license = require("./license")

const router = express.Router()

const getLoginContext = request => {
    return JSON.parse(request.headers["authorization"])
}

/** users */

router.get("/api/user/check", async (request, response) => {
    const context = getLoginContext(request)
    response.json(await license.checkAuth(context.name, context.password, context.salt))
})

router.get("/api/user", async (request, response) => {
    const context = getLoginContext(request)
    response.json(await license.findUsers(context))
})

router.post("/api/user", async (request, response) => {
    const context = getLoginContext(request)
    const name = request.body.name
    const password = request.body.password
    const readonly = request.body.readonly
    response.json(await license.createUser(context, name, password, readonly))
})

router.put("/api/user", async (request, response) => {
    const context = getLoginContext(request)
    const id = request.body.id
    const name = request.body.name
    const password = request.body.password
    const readonly = request.body.readonly
    response.json(await license.updateUser(context, id, name, password, readonly))
})

/** apps */

router.get("/api/app", async (request, response) => {
    const context = getLoginContext(request)
    response.json(await license.findApps(context))
})

router.post("/api/app", async (request, response) => {
    const context = getLoginContext(request)
    const name = request.body.name
    response.json(await license.createApp(context, name))
})

router.put("/api/app", async (request, response) => {
    const context = getLoginContext(request)
    const id = request.body.id
    const name = request.body.name
    response.json(await license.updateApp(context, id, name))
})

router.delete("/api/app", async (request, response) => {
    const context = getLoginContext(request)
    const id = request.body.id
    response.json(await license.removeApp(context, id))
})

/** licenses */

router.get("/api/license", async (request, response) => {
    const context = getLoginContext(request)
    const appId = request.query.appId
    response.json(await license.findLicenses(context, appId))
})

router.post("/api/license", async (request, response) => {
    const context = getLoginContext(request)
    const appId = request.body.appId
    const expirationTime = request.body.expirationTime
    const user = request.body.user
    const machine = request.body.machine
    const osUser = request.body.osUser
    const version = request.body.version
    response.json(await license.createLicense(context, appId, expirationTime, user, machine, osUser, version))
})

router.put("/api/license", async (request, response) => {
    const context = getLoginContext(request)
    const id = request.body.id
    const newId = (request.body.newId === null || request.body.newId === undefined) ? id : request.body.newId
    const expirationTime = request.body.expirationTime
    const user = request.body.user
    const machine = request.body.machine
    const osUser = request.body.osUser
    const version = request.body.version
    try {
        response.json(await license.updateLicense(context, id, newId, expirationTime, user, machine, osUser, version))
    } catch(e) {
        response.status(400).json(e)
    }
    
})

router.delete("/api/license", async (request, response) => {
    const context = getLoginContext(request)
    const id = request.body.id
    response.json(await license.removeLicense(context, id))
})

/** status */

router.get("/api/status", async (request, response) => {
    const licenseId = request.query.licenseId
    const user = request.query.user
    const machine = request.query.machine
    const osUser = request.query.osUser
    const version = request.query.version
    response.json(await license.verify(licenseId, user, machine, osUser, version))
})

module.exports = router
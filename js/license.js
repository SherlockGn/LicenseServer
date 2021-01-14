const fs = require("fs")
const crypto = require('crypto')
const uuid = require("uuid")

const db = require("./db");

const current = () => {
    return new Date().toJSON()
}
const matchWildcard = (wildcard, str) => {
    return new RegExp('^' + wildcard.replace(/\*/g, '.*') + '$').test(str)
}
const matchVersion = (versionDefinition, version) => {
    if (!/^[\.\d]*$/.test(version)) {
        return false
    }
    return versionDefinition.split(",").map(i => i.trim()).some(range => {
        let tag = "="
        if (range.endsWith("+") || range.endsWith("-")) {
            tag = range.charAt(range.length - 1)
            range = range.substring(0, range.length - 1)
        }
        const rangeArray = range.split(".").map(i => parseInt(i))
        const versionArray = version.split(".").map(i => parseInt(i))
        const shorter = rangeArray.length < versionArray.length ? rangeArray : versionArray
        const abs = rangeArray.length < versionArray.length ? versionArray.length - rangeArray.length : rangeArray.length - versionArray.length
        for (let i = 0; i < abs; i++) {
            shorter.push(0)
        }
        let compare = "="
        for (let i = 0; i < rangeArray.length; i++) {
            if (versionArray[i] > rangeArray[i]) {
                compare = "+"
                break
            }
            if (versionArray[i] < rangeArray[i]) {
                compare = "-"
                break
            }
        }
        return compare === tag
    })
}

module.exports = {
    init() {
        if (!fs.existsSync(db.getDbFilePath())) {
            db.createDb()
            this.createTables()
        }
    },
    async createTables() {
        await db.run(
            `CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                password TEXT,
                readonly TINYINT,
                create_time TEXT,
                update_time TEXT,
                last_login_time TEXT
            )`, []
        )
        await db.run(
            `CREATE TABLE app (
                id varchar(36) PRIMARY KEY,
                name TEXT,
                create_time TEXT,
                update_time TEXT
            )`, []
        )
        await db.run(
            `CREATE TABLE license (
                id varchar(36) PRIMARY KEY,
                app_id TEXT,
                create_time TEXT,
                update_time TEXT,
                expiration_time TEXT,
                recent_activation_time TEXT,
                activation_count INT,
                user TEXT,
                machine TEXT,
                os_user TEXT,
                version TEXT
            )`, []
        )
        const pwd = crypto.createHash("sha1").update("neko|123").digest('hex').toUpperCase();
        const time = current()
        return await db.run(
            "INSERT INTO user (name, password, readonly, create_time, update_time, last_login_time) VALUES (?, ?, ?, ?, ?, ?)",
            [ "neko", pwd, 0, time, time, time ]
        )
    },
    async checkAuth(name, password, salt) {
        if (salt == null || salt.length < 32) {
            return null
        }
        const users = await db.all(
            "SELECT * FROM user WHERE name = ?", [ name ]
        )
        if (users.length == 0) {
            return null
        }
        const user = users[0]
        const pwd = crypto.createHash("sha1").update(user.password + "|" + salt).digest('hex').toUpperCase()
        const time = current()
        if(pwd === password) {
            await db.run(
                "UPDATE user SET last_login_time = ? WHERE id = ?",
                [ time, user.id ]
            )
            user.last_login_time = time
            user.password = ""
            return user
        } else {
            return null
        }
    },
    async findUsers(context) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        const users = await db.all(
            "SELECT * FROM user", []
        )
        users.forEach(u => {
            u.password = ""  
        })
        return users
    },
    async createUser(context, name, password, readonly) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        const users = await db.all(
            "SELECT * FROM user WHERE name = ?", [ name ]
        )
        if (users.length != 0) {
            throw new Error("User already exists")
        }
        const pwd = crypto.createHash("sha1").update(name + "|" + password).digest('hex').toUpperCase();
        const time = current()
        return await db.run(
            "INSERT INTO user (name, password, readonly, create_time, update_time, last_login_time) VALUES (?, ?, ?, ?, ?, ?)",
            [ name, pwd, readonly ? 1 : 0, time, time, time ]
        )
    },
    async updateUser(context, id, name, password, readonly) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        const users = await db.all(
            "SELECT * FROM user WHERE id = ?", [ id ]
        )
        if (users.length == 0) {
            throw new Error("User not exist")
        }
        const user = users[0]
        let allow = false
        if (operator.readonly === 0) {
            allow = true
        }
        if (operator.readonly === 1 && name === operator.name && readonly === true) {
            allow = true
        }
        if (!allow) {
            throw new Error("Readonly user")
        }
        const time = current()
        if (password === null) {
            return await db.run(
                "UPDATE user SET readonly=?, update_time=? WHERE id=?",
                [ readonly ? 1 : 0, time, id ]
            )
        } else {
            const pwd = crypto.createHash("sha1").update(name + "|" + password).digest('hex').toUpperCase()
            return await db.run(
                "UPDATE user SET password=?, readonly=?, update_time=? WHERE id=?",
                [ pwd, readonly ? 1 : 0, time, id ]
            )
        }
    },
    async createApp(context, name) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        const time = current()
        return await db.run(
            "INSERT INTO app (id, name, create_time, update_time) VALUES (?, ?, ?, ?)",
            [ uuid.v4(), name, time, time ]
        )
    },
    async findApps(context) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        return await db.all(
            "SELECT * FROM app", []
        )
    },
    async updateApp(context, id, name) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        let apps = await db.all(
            "SELECT * FROM app WHERE id = ?", [ id ]
        )
        if (apps.length == 0) {
            throw new Error("App not exist")
        }
        const time = current()
        return await db.run(
            "UPDATE app SET name = ?, update_time = ? WHERE id = ?",
            [ name, time, id ]
        )
    },
    async removeApp(context, appId) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        return [
            await db.run(
                "DELETE FROM app WHERE id = ?",
                [ appId ]
            ),
            await db.run(
                "DELETE FROM license WHERE app_id = ?",
                [ appId ]
            ),
        ]
    },
    async createLicense(context, appId, expirationTime, user, machine, osUser, version) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        if ((await db.all("SELECT * FROM app WHERE id = ?",  [ appId ])).length === 0) {
            throw new Error("App not exists")
        }
        const time = current()
        return await db.run(
            "INSERT INTO license (id, app_id, create_time, update_time, expiration_time, recent_activation_time, activation_count, user, machine, os_user, version) VALUES " + 
            "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [ uuid.v4(), appId, time, time, expirationTime, time, 0, user, machine, osUser, version ]
        )
    },
    async findLicenses(context, appId) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        return await db.all(
            "SELECT * from license WHERE app_id = ?",
            [ appId ]
        )
    },
    async updateLicense(context, id, newId, expirationTime, user, machine, osUser, version) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        let licenses = await db.all(
            "SELECT * FROM license WHERE id = ?", [ id ]
        )
        if (licenses.length == 0) {
            throw new Error("License not exist")
        }
        const time = current()
        return await db.run(
            "UPDATE license SET id = ?, expiration_time = ?, user = ?, machine = ?, os_user = ?, version = ?, update_time = ? WHERE id = ?",
            [ newId, expirationTime, user, machine, osUser, version, time, id ]
        )
    },
    async removeLicense(context, id) {
        const operator = await this.checkAuth(context.name, context.password, context.salt)
        if (operator === null) {
            throw new Error("Login failed")
        }
        if (operator.readonly === 1) {
            throw new Error("Permission denied")
        }
        return await db.run(
            "DELETE FROM license WHERE id = ?",
            [ id ]
        )
    },
    async verify(licenseId, user, machine, osUser, version) {
        if (!licenseId) { licenseId = "" }
        if (!user) { user = "" }
        if (!machine) { machine = "" }
        if (!osUser) { osUser = "" }
        if (!version) { version = "1" }
        const licenses = await db.all(
            "SELECT * from license WHERE id = ?",
            [ licenseId ]
        )
        if (licenses.length === 0) {
            return {
                status: "not found",
                app: null,
                verify: false
            }
        }
        const license = licenses[0]
        const ret = {
            status: "",
            app: (await db.all(
                "SELECT * from app WHERE id = ?",
                [ license.app_id ]
            ))[0],
            verify: false
        }
        if (!matchWildcard(license.user, user)) {
            ret.status = "user not match"
        } else if (!matchWildcard(license.machine, machine)) {
            ret.status = "machine not match"
        } else if (!matchWildcard(license.os_user, osUser)) {
            ret.status = "os user not match"
        } else if (!matchVersion(license.version, version)){
            ret.status = "version not match"
        } else if (new Date().getTime() > new Date(license.expiration_time).getTime()){
            ret.status = "license expired"
        } else {
            ret.status = "license available"
            ret.verify = true
            await db.run(
                "UPDATE license SET recent_activation_time = ?, activation_count = ? WHERE id = ?",
                [ current(), license.activation_count + 1, license.id ]
            )
        }
        return ret
    }
}
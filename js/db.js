const path = require("path")
const fs = require("fs")

const sqlite = require("sqlite3")
const { runInContext } = require("vm")

module.exports = {
    conn: {},
    keep: 10 * 60 * 1000,
    dbName: "license",
    getDbFilePath() {
        return path.join(__dirname, "..", `${this.dbName}.db`)
    },
    async createDb() {
        return new Promise((resolve, reject) => {
            const db = new sqlite.Database(this.getDbFilePath(),
                (err) => err ? reject(err) : resolve(db)
            )
        })
    },
    closeDb() {
        let con = this.conn[this.dbName]
        if (con && con.db.open) {
            con.db.close()
            clearTimeout(con.timer)
        }
    },
    async connect() {
        let con = this.conn[this.dbName]
        if (!con || !con.db.open) {
            const db = await this.createDb()
            const timer = setTimeout(() => {
                db.close()
            }, this.keep)
            this.conn[this.dbName] = con = {
                db, timer
            }
        } else {
            clearTimeout(con.timer)
            con.timer = setTimeout(() => {
                con.db.close()
            }, this.keep)
        }
        return con.db
    },
    async run(statement, params) {
        const con = await this.connect()
        return new Promise((resolve, reject) => {
            con.run(statement, params, function(err) {
                if (err) {
                    reject(err)
                }
                resolve(this)
            })
        })
    },
    async all(statement, params) {
        const con = await this.connect()
        return new Promise((resolve, reject) => {
            con.all(statement, params, (err, res) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(res)
            })
        })
    },
}
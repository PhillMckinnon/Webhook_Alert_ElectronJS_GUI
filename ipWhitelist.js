
const sqlite3 = require('sqlite3').verbose();
const { getUserDataDir } = require('./userpath');
const path = require('path');
const dbPath = path.join(getUserDataDir(), 'webhooks.db');

const db = new sqlite3.Database(dbPath);

class IPWhitelist {
    static isIpAllowed(ip) {
        const cleanIp = ip.replace(/^::ffff:/, '');
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM ip_whitelist WHERE allowed_ip = ? OR allowed_ip = ?`,
                [ip, cleanIp],  
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row.count > 0);
                }
            );
        });
    }
}

module.exports = IPWhitelist;

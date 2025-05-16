const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');
const Logger = require('./logger');
const { getUserDataDir } = require('./userpath');
const dbPath = path.join(getUserDataDir(), 'webhooks.db');
const dbExists = fs.existsSync(dbPath);
const portFilePath = path.join(getUserDataDir(), 'port.json');
if (!fs.existsSync(portFilePath)) {
    fs.writeFileSync(portFilePath, JSON.stringify({ port: 3000 }, null, 2));
}
const portConfig = JSON.parse(fs.readFileSync(portFilePath, 'utf-8'));
const port = portConfig.port;
function getLocalIp() {
    const networkInterfaces = os.networkInterfaces();
    for (let interfaceName in networkInterfaces) {
        for (let network of networkInterfaces[interfaceName]) {
            if (network.family === 'IPv4' && !network.internal) {
                if (network.address.startsWith('192.168.') || network.address.startsWith('10.') || network.address.startsWith('172.')) {
                    return network.address;
                }
            }
        }
    }
    return 'localhost'; 
}
function checkAndUpdatePort() {
    if (port === 3000) return; 
    
    const localIp = getLocalIp();
    Logger.info(`Updating webhook URLs to port ${port}...`);

    db.all(`SELECT * FROM webhook_data`, (err, webhooks) => {
        if (err) return Logger.error(`Port update failed: ${err.message}`);
        
        webhooks.forEach(webhook => {
            const webhookNumber = webhook.webhook_name.replace('webhook', '');
            const newUrl = `http://${localIp}:${port}/webhook${webhookNumber}`;
            
            if (webhook.url !== newUrl) {
                db.run(`UPDATE webhook_data SET url = ? WHERE id = ?`, 
                    [newUrl, webhook.id], 
                    (updateErr) => {
                        if (updateErr) {
                            Logger.error(`Failed to update webhook ${webhook.id}: ${updateErr.message}`);
                        } else {
                            Logger.success(`Updated webhook ${webhook.id} to ${newUrl}`);
                        }
                    }
                );
            }
        });
    });
}
const db = new sqlite3.Database(dbPath, (err)=>{
    if(err) {
        Logger.error(`Database connection error: ${err.message}`);
    }
    else {
        Logger.info('Connected to webhooks.db');
        if(!dbExists) {
            initialiseDatabase(() => {
                Logger.success('Database initialized and ready!');

            });
        } else {
            initialiseDatabase(() => {
                checkAndUpdatePort(); 
                Logger.success('Database checked and ready!');
            });
        }
    }
});

function initialiseDatabase(onReady) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS ip_whitelist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            allowed_ip TEXT NOT NULL
        )`, (err) => {
            if (err) return Logger.error(`Error creating ip_whitelist: ${err.message}`);
            Logger.info(`Created table ip_whitelist`);
        });

        db.run(`CREATE TABLE IF NOT EXISTS webhook_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            webhook_name TEXT NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL CHECK (is_active IN(0, 1)),
            url TEXT NOT NULL UNIQUE,
            up_alerts INTEGER DEFAULT 0,
            down_alerts INTEGER DEFAULT 0,
            time_since_last_up_alert INTEGER DEFAULT 0,
            time_since_last_down_alert INTEGER DEFAULT 0,
            success_name TEXT NOT NULL,
            error_name TEXT NOT NULL
        )`, (err) => {
            if (err) return Logger.error(`Error creating webhook_data: ${err.message}`);
            Logger.info('Created table webhook_data');

            db.get(`SELECT COUNT(*) as count FROM webhook_data`, (err, row) => {
                if (err) return Logger.error(`Error checking webhook_data count: ${err.message}`);
                
                if (row.count === 0) {
                    Logger.info('No webhook_data found, inserting default rows...');
                    insertDefaultWebhookData(onReady); 
                } else {
                    Logger.info('webhook_data already initialized.');
                    if (onReady) onReady(); 
                }
            });
        });
    });
}


function insertDefaultWebhookData(callback) {
    const localIp = getLocalIp();
    const stmt = db.prepare(`INSERT OR IGNORE INTO webhook_data 
        (webhook_name, is_active, url, up_alerts, down_alerts, time_since_last_up_alert, time_since_last_down_alert, success_name, error_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    let completed = 0;
    for (let i = 0; i < 5; i++) {
        const webhookName = `webhook${i}`;
        const isActive = 1;
        const url = `http://${localIp}:${port}/webhook${i}`;
        const up_alerts = 0;
        const down_alerts = 0;
        const time_since_last_up_alert = 0;
        const time_since_last_down_alert = 0;
        const success_name = `success${i}.wav`;
        const error_name = `error${i}.wav`;

        stmt.run(webhookName, isActive, url, up_alerts, down_alerts, time_since_last_up_alert, time_since_last_down_alert, success_name, error_name, (err) => {
            if (err) Logger.error(`Error inserting default webhook ${webhookName}: ${err.message}`);
            else Logger.info(`Inserted default webhook ${webhookName}`);
            
            completed++;
            if (completed === 5) {
                stmt.finalize();
                if (callback) callback();
            }
        });
    }
}


// =====IP_WHITELIST METHODS=====

function addIp(ip, callback){
    db.run(`INSERT INTO ip_whitelist (allowed_ip) VALUES (?)`,[ip], function(err)
    {
        if(err)
        {
            Logger.error(`addIp error: ${err.message}`);
            if (callback) callback(err);
        } else {
            Logger.success(`Added IP: ${ip}`);
            if (callback) callback(null, this.lastID);
        }
    });
}

function getAllIps(callback)
{
    db.all(`SELECT * FROM ip_whitelist`, [], (err, rows) =>
    {
        if (err)
        {
            Logger.error(`getAllIps error: ${err.message}`);
            callback(err, []);
        } else {
            callback(null, rows);
        }
    });
}

function updateIp(id, newIp, callback)
{
    db.run(`UPDATE ip_whitelist SET allowed_ip = ? WHERE id = ?`, [newIp, id], function (err){
        if (err)
        {
            Logger.error(`updateIp error: ${err.message}`);
            if (callback) callback(err);
        } else {
            Logger.success(`Updated IP id=${id} to ${newIp}`);
            if(callback) callback(null, this.changes);
        }
    });
}

function deleteIp(id, callback)
{
    db.run(`DELETE FROM ip_whitelist WHERE id = ?`, [id], function (err){
        if(err) {
            Logger.error(`deleteIp error: ${err.message}`);
            if (callback) callback(err);
        } else {
            Logger.success(`Deleted IP id=${id}`);
            if (callback) callback(null, this.changes);
        }
    });
}
function incrementElapsedTimes() {
    db.run(`UPDATE webhook_data 
           SET time_since_last_up_alert = time_since_last_up_alert + 5 
           WHERE time_since_last_up_alert > 0`);

    db.run(`UPDATE webhook_data 
           SET time_since_last_down_alert = time_since_last_down_alert + 5 
           WHERE time_since_last_down_alert > 0`);
}
// =====WEBHOOK DB METHODS=====
function addWebHook(data, callback)
{
    db.run(`INSERT INTO webhook_data (webhook_name, is_active, url, up_alerts, down_alerts, time_since_last_up_alert, time_since_last_down_alert
        success_name, error_name) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.webhook_name,
            data.is_active ? 1 : 0,
            data.url,
            data.up_alerts,
            data.down_alerts,
            data.time_since_last_up_alert,
            data.time_since_last_down_alert,
            data.success_name,
            data.error_name
        ],
        function(err){
            if(err){
                Logger.error(`addWebHook error: ${err.message}`);
                if (callback) callback(err);
            } else {
                Logger.success(`Added webhook: ${data.webhook_name}`);
                if (callback) callback(null, this.lastID);
            }
        } 
    );
}

function getAllWebhooks() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM webhook_data`, [], (err, rows) => {
            if (err) {
                Logger.error(`getAllWebhooks error: ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


function updateWebhook(id, updatedData, callback)
{
    db.run(`UPDATE webhook_data
            SET webhook_name = ?,
            is_active = ?,
            url = ?,
            up_alerts = ?,
            down_alerts = ?,
            time_since_last_up_alert = ?,
            time_since_last_down_alert = ?,
            success_name = ?,
            error_name = ?
        WHERE id = ?`,
    [
        updatedData.webhook_name,
        updatedData.is_active ? 1 : 0,
        updatedData.url,
        updatedData.up_alerts,
        updatedData.down_alerts,
        updatedData.time_since_last_up_alert,
        updatedData.time_since_last_down_alert,
        updatedData.success_name,
        updatedData.error_name,
        id
    ],
    function (err)
    {
        if(err)
        {
            Logger.error(`updateWebhook error: ${err.message}`);
            if(callback) callback(err);
        } else {
            Logger.success(`Updated webhook id=${id}`);
            if(callback) callback(null, this.changes);
        }
    }
);
}

function deleteWebhook(id, callback)
{
    db.run(`DELETE FROM webhook_data WHERE id = ?`, [id], function(err){
        if (err) {
            Logger.error(`deleteWebhook error: ${err.message}`);
            if(callback) callback(err);
        } else {
            Logger.success(`Deleted webhook id=${id}`);
            if(callback) callback(null, this.changes);
        }
    });
}

module.exports = {addIp, getAllIps, updateIp, deleteIp, addWebHook, getAllWebhooks, updateWebhook, deleteWebhook, initialiseDatabase, insertDefaultWebhookData, incrementElapsedTimes}
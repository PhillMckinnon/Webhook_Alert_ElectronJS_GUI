const $ = require('jquery');
const sqlite3 = require('sqlite3').verbose();

const { getUserDataDir } = require('./userpath');
const path = require('path');
const fs = require('fs');
const {addIp, getAllIps, updateIp, deleteIp, addWebHook, getAllWebhooks, updateWebhook, deleteWebhook, initialiseDatabase, insertDefaultWebhookData, incrementElapsedTimes} = require('./database');
const Logger = require('./logger');
const dbPath = path.join(getUserDataDir(), 'webhooks.db');
const db = new sqlite3.Database(dbPath);
class GUIManager {
    static async attachWebhookToggleHandlers() {
        const names = ['zero', 'one', 'two', 'three', 'four'];
    
        names.forEach((name, index) => {
            const buttonId = `#webhook${name}-btn`;
    
            $(document).off('click', buttonId); 
            $(document).on('click', buttonId, async () => {
                try {
                    const data = await getAllWebhooks();
                    const webhook = data[index];
    
                    if (!webhook) {
                        Logger.error(`Webhook at index ${index} not found`);
                        return;
                    }
    
                    const newStatus = !webhook.is_active;
    
                    await updateWebhook(webhook.id, { ...webhook, is_active: newStatus });
                    await GUIManager.loadWebhookData();
                } catch (err) {
                    Logger.error(`Error toggling webhook ${name}:`, err);
                }
            });
        });
    }
    static async load_log()
    {
        $('#log-btn').on('click', () => {
            if($('#log-btn').text() == 'Show Log')
                {
                    const logPath = path.join(getUserDataDir(), 'app.log');
                    fs.readFile(logPath, 'utf8', (err, data) => {
                        if (err) {
                            Logger.error('Failed to read log file:', err);
                            $('#logtext').val('Could not load log file.');
                            return;
                        }
                        $('#logtext').val(data);
                        $('#log-btn').text('Hide Log')
                        $('#logtext').toggle();

                    });
                } 
           if($('#log-btn').text() == 'Hide Log')
           {
            $('#logtext').val('');
            $('#log-btn').text('Show Log')
            $('#logtext').toggle();
           }
        });
    }
    static formatDuration(seconds) {
        if (!seconds) return '0 seconds';
        
        const units = [
            { name: 'day', seconds: 86400 },
            { name: 'hour', seconds: 3600 },
            { name: 'minute', seconds: 60 },
            { name: 'second', seconds: 1 }
        ];
    
        return units.reduce((acc, unit) => {
            if (seconds >= unit.seconds) {
                const count = Math.floor(seconds / unit.seconds);
                seconds %= unit.seconds;
                acc.push(`${count} ${unit.name}${count !== 1 ? 's' : ''}`);
            }
            return acc;
        }, []).join(' ');
    }
    static async loadWebhookData() {
        try {
            const data = await getAllWebhooks();
            if (!Array.isArray(data)) {
                Logger.error('Invalid data format:', data);
                return;
            }

            const names = ['zero', 'one', 'two', 'three', 'four'];
            data.forEach((webhook, index) => {
                const name = names[index];
                if (!name) return;

                const webhookNumber = names.indexOf(name);

                const activeStatus = webhook.is_active ? 'Active' : 'Inactive';
                const webhookURL = webhook.url || `Error loading URL`;
                const upAlerts = webhook.up_alerts || 0;
                const downAlerts = webhook.down_alerts || 0;
                const timeSinceLastUpAlert = webhook.time_since_last_up_alert ?? 0;
                const timeSinceLastDownAlert = webhook.time_since_last_down_alert ?? 0;
                const successName = webhook.success_name || `success${webhookNumber}.wav`;
                const errorName = webhook.error_name || `error${webhookNumber}.wav`;
                const buttonText = webhook.is_active ? 'DISABLE' : 'ENABLE';

                $(`#webhook${name}`).text(`Webhook${webhookNumber}`);
                $(`#webhook${name}-url strong`).text(activeStatus);
                $(`#webhook${name}-url .summary`).text(webhookURL);
                $(`#webhook${name}-upcnt strong`).text(`✅Up alerts (${upAlerts})`);
                $(`#webhook${name}-downcnt strong`).text(`❌Down alerts (${downAlerts})`);
                $(`#wb${webhookNumber}upalt`).text(`${GUIManager.formatDuration(timeSinceLastUpAlert)}`);
                $(`#wb${webhookNumber}dwnalt`).text(`${GUIManager.formatDuration(timeSinceLastDownAlert)}`);
                $(`#webhook${name}-success strong`).text(`✅${successName}`);
                $(`#webhook${name}-error strong`).text(`❌${errorName}`);
                $(`.webhook.${name} button`).text(buttonText);
            });

        } catch (error) {
            Logger.error('Error loading webhooks:', error);
        }
    }
    static async loadIpWhitelist() {
        try {
            const ips = await new Promise((resolve, reject) => {
                getAllIps((err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.allowed_ip).join(', '));
                });
            });
            $('#whitelist').val(ips);
        } catch (error) {
            Logger.error('Failed to load IP whitelist:', error);
        }
    }
    static startIpMonitoring() {
        setInterval(async () => {
            try {
                const currentIps = await new Promise((resolve, reject) => {
                    getAllIps((err, rows) => {
                        if (err) reject(err);
                        else resolve(rows.map(row => row.allowed_ip));
                    });
                });

                const textareaContent = $('#whitelist').val().trim();
                const enteredIps = textareaContent.split(',')
                .map(ip => ip.trim().replace(/^::ffff:/, ''))  
                .filter(ip => ip.length > 0);

                if (JSON.stringify(currentIps) !== JSON.stringify(enteredIps)) {
                    await new Promise(resolve => {
                        db.run(`DELETE FROM ip_whitelist`, (err) => {
                            if (err) Logger.error(err);
                            resolve();
                        });
                    });

                    const stmt = db.prepare(`INSERT INTO ip_whitelist (allowed_ip) VALUES (?)`);
                    for (const ip of enteredIps) {
                        await new Promise(resolve => {
                            stmt.run(ip, (err) => {
                                if (err) Logger.error(err);
                                resolve();
                            });
                        });
                    }
                    stmt.finalize();
                    
                    $('#whitelist').val(enteredIps.join(', '));
                }
            } catch (error) {
                Logger.error(`IP sync error: ${error?.message || error}`);
                console.error(error);
            }
        }, 5000);
    }
}

module.exports = { GUIManager };
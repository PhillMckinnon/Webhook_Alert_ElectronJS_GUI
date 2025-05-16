const SoundManager = require('./SoundManager');
const { getUserDataDir } = require('./userpath');
const {addIp, getAllIps, updateIp, deleteIp, addWebHook, getAllWebhooks, updateWebhook, deleteWebhook, initialiseDatabase, insertDefaultWebhookData, incrementElapsedTimes} = require('./database');

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(getUserDataDir(), 'webhooks.db');
const db = new sqlite3.Database(dbPath);
const Logger = require('./logger');
class WebhookHandler {
    static getClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded 
            ? forwarded.split(',')[0].trim()
            : req.socket.remoteAddress;
        return ip.replace(/^::ffff:/, '');
    }
    static async isIpAllowed(ip) {
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all(`SELECT allowed_ip FROM ip_whitelist`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            const normalizedClientIp = ip.replace(/^::ffff:/, '');
            return rows.some(row => {
                const storedIp = row.allowed_ip.replace(/^::ffff:/, '');
                return storedIp === normalizedClientIp;
            });
            
        } catch (error) {
            Logger.error(`IP check failed: ${error.message}`);
            return false;
        }
    }
    static async handle(req, res) {
        try {
            const clientIP = WebhookHandler.getClientIp(req);
            Logger.info(`Incoming request from IP: ${clientIP}`);
            const isAllowed = await WebhookHandler.isIpAllowed(clientIP);
            if (!isAllowed) {
                Logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
                return res.status(403).send('Forbidden: IP not allowed');
            }


            const payload = req.body;
            if (!payload || !payload.heartbeat || typeof payload.heartbeat.status === 'undefined') {
                Logger.warn(`Invalid payload received from ${clientIP}`);
                return res.status(400).send('Bad Request: Invalid payload');
            }

            const statusCheck = Number(payload.heartbeat.status);
            Logger.info(`Received heartbeat status: ${statusCheck}`);

            const webhookName = req.path.replace('/', '');

            db.get(`SELECT * FROM webhook_data WHERE webhook_name = ?`, [webhookName], (err, webhook) => {
                if (err) {
                    Logger.error(`Database error for webhook lookup: ${err.message}`);
                    return res.status(500).send('Internal Server Error');
                }

                if (!webhook) {
                    Logger.warn(`Webhook ${webhookName} not found.`);
                    return res.status(404).send('Webhook not found');
                }

                if (webhook.is_active !== 1) {
                    Logger.warn(`Webhook ${webhookName} is inactive. Rejecting request.`);
                    return res.status(403).send('Webhook is inactive');
                }

                const soundFile = statusCheck === 0 ? webhook.error_name : webhook.success_name;
                const isSuccess = statusCheck !== 0;
                
                SoundManager.playSound(soundFile)
                    .then(async () => {
                        const updatedData = {
                            ...webhook,
                            up_alerts: isSuccess ? webhook.up_alerts + 1 : webhook.up_alerts,
                            down_alerts: !isSuccess ? webhook.down_alerts + 1 : webhook.down_alerts,
                            time_since_last_up_alert: isSuccess ? 0 + 1 : webhook.time_since_last_up_alert,
                            time_since_last_down_alert: !isSuccess ? 0 + 1: webhook.time_since_last_down_alert
                        };
                        
                
                        await new Promise((resolve, reject) => {
                            updateWebhook(webhook.id, updatedData, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                        
                        Logger.info(`Successfully played sound: ${soundFile}`);
                        res.sendStatus(200);
                    });
            });
        }catch (error) {
            Logger.error(`Handler error: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = WebhookHandler;

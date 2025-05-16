const fs = require('fs');
const path = require('path');
const { getUserDataDir } = require('./userpath');
class Logger {
    static logFilePath = path.join(getUserDataDir(), 'app.log');
    static maxLogSize = 5 * 1024 * 1024; // 5 MB

    static getTimestamp() {
        return new Date().toISOString();
    }

    static colorize(text, colorCode) {
        return `\x1b[${colorCode}m${text}\x1b[0m`;
    }

    static async rotateLogFileIfNeeded() {
        try {
            if (fs.existsSync(Logger.logFilePath)) {
                const stats = fs.statSync(Logger.logFilePath);
                if (stats.size >= Logger.maxLogSize) {
                    const rotatedFile = Logger.logFilePath.replace('.log', `-${Date.now()}.log`);
                    fs.renameSync(Logger.logFilePath, rotatedFile);
                    console.log(Logger.colorize(`[LOGGER]`, '36'), `Rotated log file to ${rotatedFile}`);
                }
            }
        } catch (err) {
            console.error('Failed to rotate log file:', err.message);
        }
    }

    static async writeToFile(message) {
        await Logger.rotateLogFileIfNeeded();

        fs.appendFile(Logger.logFilePath, message + '\n', (err) => {
            if (err) {
                console.error('Failed to write to log file:', err.message);
            }
        });
    }

    static info(message) {
        const prefix = Logger.colorize(`[INFO]`, '34'); // Blue
        const logMessage = `[INFO] ${Logger.getTimestamp()} - ${message}`;
        console.log(`${prefix} ${Logger.getTimestamp()} - ${message}`);
        Logger.writeToFile(logMessage);
    }

    static success(message) {
        const prefix = Logger.colorize(`[SUCCESS]`, '32'); // Green
        const logMessage = `[SUCCESS] ${Logger.getTimestamp()} - ${message}`;
        console.log(`${prefix} ${Logger.getTimestamp()} - ${message}`);
        Logger.writeToFile(logMessage);
    }

    static warn(message) {
        const prefix = Logger.colorize(`[WARN]`, '33'); // Yellow
        const logMessage = `[WARN] ${Logger.getTimestamp()} - ${message}`;
        console.warn(`${prefix} ${Logger.getTimestamp()} - ${message}`);
        Logger.writeToFile(logMessage);
    }

    static error(message) {
        const prefix = Logger.colorize(`[ERROR]`, '31'); // Red
        const logMessage = `[ERROR] ${Logger.getTimestamp()} - ${message}`;
        console.error(`${prefix} ${Logger.getTimestamp()} - ${message}`);
        Logger.writeToFile(logMessage);
    }
}

module.exports = Logger;

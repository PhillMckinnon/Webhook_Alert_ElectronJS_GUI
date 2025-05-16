const path = require('path');
const fs = require('fs');
const soundPlayer = require('node-wav-player');
const Logger = require('./logger');

const basePath = path.join(process.resourcesPath, 'sounds')
             

class SoundManager {
    static getSoundPath(filename) {
        return path.join(basePath, filename);
    }

    static async playSound(filename) {

        const soundPath = this.getSoundPath(filename);
        
        if (!fs.existsSync(soundPath)) {
            const error = `Sound file not found: ${path.basename(soundPath)}`;
            Logger.error(error);
            throw new Error(error);
        }

        try {
            await soundPlayer.play({
                path: soundPath,
                sync: true
            });
            Logger.info(`Successfully played: ${filename}`);
        } catch (err) {
            Logger.error(`Playback failed: ${err.message}`);
            throw err;
        }
    }

    static getAvailableSounds() {
        try {
            return fs.readdirSync(basePath)
                .filter(file => path.extname(file).toLowerCase() === '.wav');
        } catch (error) {
            Logger.error(`Sound directory error: ${error.message}`);
            return [];
        }
    }
}

module.exports = SoundManager;

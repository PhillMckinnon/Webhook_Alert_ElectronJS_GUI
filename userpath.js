let userDataDir = null;

function setUserDataDir(dir) {
    userDataDir = dir;
}

function getUserDataDir() {
    if (!userDataDir) {
        throw new Error('User data directory not initialized!');
    }
    return userDataDir;
}

module.exports = {
    setUserDataDir,
    getUserDataDir
};

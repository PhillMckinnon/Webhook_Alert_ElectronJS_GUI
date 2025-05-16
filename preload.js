const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path')
});
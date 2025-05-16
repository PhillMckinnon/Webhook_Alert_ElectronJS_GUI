const { app, BrowserWindow, ipcMain } = require('electron');

app.whenReady().then(() => {
  const userDataDir = app.getPath('userData');
  const win = new BrowserWindow({
    width: 1280,
    height: 620,
    webPreferences: {
      nodeIntegration: true,  
      contextIsolation: false,
      additionalArguments: [`--userDataDir=${userDataDir}`] 
    },
  });

  win.loadFile('index.html'); 
  win.removeMenu();

});

ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

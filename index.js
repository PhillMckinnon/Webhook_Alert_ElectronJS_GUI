const AppPaths = require('./userpath'); 


(async () => {

    const arg = process.argv.find(a => a.startsWith('--userDataDir='));
    if (!arg) throw new Error('userDataDir not passed!');
    const userDataDir = arg.split('=')[1];
    AppPaths.setUserDataDir(userDataDir); 
    const fs = require('fs');
    const express = require('./node_modules/express');
    const Logger = require('./logger');
    const path = require('path');
    const $ = require('jquery');
    const bodyParser = require('body-parser');
    const {GUIManager} = require('./GUI_manager');
    const WebhookHandler = require('./WebhookHandler');
    const { initialiseDatabase, incrementElapsedTimes } = require('./database');

    initialiseDatabase();

    $(document).ready(async () => {

        await GUIManager.loadWebhookData();
        await GUIManager.loadIpWhitelist();
        await GUIManager.attachWebhookToggleHandlers();
        await GUIManager.load_log();
        GUIManager.startIpMonitoring();
        setInterval(() => incrementElapsedTimes(), 5000);
        setInterval(() => GUIManager.loadWebhookData(), 5000);
    });


    const appe = express();
    const portFilePath = path.join(userDataDir, 'port.json');
    appe.use(express.static(userDataDir));
    const portConfig = JSON.parse(fs.readFileSync(portFilePath, 'utf-8'));
    const port = portConfig.port;

    appe.use(bodyParser.json());

    appe.post('/webhook0', WebhookHandler.handle);
    appe.post('/webhook1', WebhookHandler.handle);
    appe.post('/webhook2', WebhookHandler.handle);
    appe.post('/webhook3', WebhookHandler.handle);
    appe.post('/webhook4', WebhookHandler.handle);



    appe.listen(port, () => {
        Logger.success(`Server running on port ${port}`);
    });
})();
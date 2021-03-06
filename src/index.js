import * as debug from './debug';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

export default {
    // Multiple browsers support
    isMultiBrowser: true,

    adbCommand: 'adb',

    // Required - must be implemented
    // Browser control
    // eslint-disable-next-line no-unused-vars
    async openBrowser (id, pageUrl, browserName) {
        debug.log('running openBrowser' + browserName);
        const browsers = await this.getBrowserList();

        if (browsers.length === 0) 
            throw new Error('No browsers detected by adb, or fault in adb. Check your adb devices command');
        
        if (browsers.length === 1)
            debug.log('One device found. Running in single device mode... Ignoring Browsername if provided');
        
        if (browsers.length > 1 && !browserName) {
            debug.log('-----Multiple devices detected. Please specify a browser------');
            throw new Error('Multiple device detection failure');
        }
        else {
            if (browserName) 
                this.adbCommand = 'adb -s ' + browserName + ' ';
            
            await this.killChrome();
            await this.clearChrome();
            await this.resetChromeWelcome();
            await this.openChromeBrowser(pageUrl);
        }
    },

    async closeBrowser (/* id */) {
        await debug.log('running closeBrowser');
        await this.killChrome();
    },

    async openChromeBrowser (/* id, */ url) {
        await debug.log('running openBrowser with url:' + url);
        let shellCmd = this.adbCommand + ' shell am start -n com.android.chrome/com.google.android.apps.chrome.Main ';
        
        if (url && url.length > 0)
            shellCmd += '-d \'' + url + '\'';
        
        shellCmd += ' --activity-clear-task';
        debug.log('start chrome command: ' + shellCmd);
        await exec(shellCmd);

    },

    async resetChromeWelcome (/* id */) {
        //new android uses this technique
        await exec(this.adbCommand + ' shell am set-debug-app --persistent com.android.chrome');
        //old android uses this technique
        await exec(this.adbCommand + ' shell \'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line\'');
    },

    async keyPress (/* id, */ keyId) {
        await exec(this.adbCommand + ' shell input keyevent ' + keyId);
    },

    async clearChrome (/* id */) {
        await exec(this.adbCommand + 'shell pm clear com.android.chrome');
    },

    async killChrome (/* id */) {
        await exec(this.adbCommand + 'shell am force-stop com.android.chrome');
    },

    // Optional - implement methods you need, remove other methods
    // Initialization
    async init () {
        return;
    },

    async dispose () {
        return;
    },

    // Browser names handling
    async getBrowserList () {
        const devices = [];
        const { stdout } = await exec('adb devices');
        
        let skip = true;
        
        debug.log('---- Device List ----');
        var lines = stdout.split(/\r?\n/);
        
        for (const lineNum in lines) {
            if (!skip) {
                const line = lines[lineNum];
                const device = line.split(/(\t+)/)[0];  

                if (device.length > 0) {
                    debug.log('device found: ' + device);  
                    devices.push(device);
                }
            }
            else
                skip = false;
        }
        
        return devices;
    },

    async isValidBrowserName (browserName) {
        const browsers = await this.getBrowserList();
        const found = browsers.indexOf(browserName) > -1;

        if (browsers.length === 0)
            debug.log('No devices returned from adb. Please check your simulators and device connectivity using adb.');
        else if (!found)
            debug.log('Browser not found, try:' + JSON.stringify(browsers));
        return found;
    },
    

    // Extra methods
    async resizeWindow (/* id, width, height, currentWidth, currentHeight */) {
        this.reportWarning('The window resize functionality is not supported by the "android" browser provider.');
    },

    async takeScreenshot (/* id, screenshotPath, pageWidth, pageHeight */) {
        this.reportWarning('The screenshot functionality is not supported by the "android" browser provider.');
    }
};

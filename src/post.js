const core = require('@actions/core');
const exec = require('@actions/exec');
const logging = require('./logging');
const path = require('path');

const STEAM_DIR = process.env.STEAM_DIR;
const RUNNER_TEMP = process.env.RUNNER_TEMP;
const steamworks = path.join(RUNNER_TEMP, '.steamworks');
const build_output = path.join(RUNNER_TEMP, 'output');

async function Run() {
    let printLogs = core.isDebug();
    try {
        // TODO Implement step cleanup and removing STEAM_DIR/config/config.vdf
        await exec.exec('echo "Hello, World!"');
    } catch (error) {
        core.setFailed(error.message);
    }

    if (printLogs) {
        await logging.PrintLogs(build_output);
        await logging.PrintLogs(path.join(STEAM_DIR, 'logs'));
        await logging.PrintLogs(path.join(steamworks, 'buildoutput'));
    }
};

module.exports = { Run }

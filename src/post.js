const core = require('@actions/core');
const exec = require('@actions/exec');
const logging = require('./logging');
const path = require('path');

const STEAM_DIR = process.env.STEAM_DIR;
const RUNNER_TEMP = process.env.RUNNER_TEMP;
const steamworks = path.join(RUNNER_TEMP, '.steamworks');
const build_output = path.join(RUNNER_TEMP, 'output');

async function Run() {
    try {
        let printLogs = core.isDebug();
        if (printLogs) {
            await logging.PrintLogs(build_output);
            await logging.PrintLogs(path.join(STEAM_DIR, 'logs'));
            await logging.PrintLogs(path.join(STEAM_CMD, 'logs'));
            await logging.PrintLogs(path.join(steamworks, 'buildoutput'));
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

module.exports = { Run }

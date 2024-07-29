const core = require('@actions/core');
const logging = require('./logging');
const path = require('path');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;
const RUNNER_TEMP = process.env.RUNNER_TEMP;
const steamworks = path.join(RUNNER_TEMP, '.steamworks');

async function Run() {
    try {
        await logging.PrintLogs(steamworks);
        await logging.PrintLogs(path.join(STEAM_DIR, 'logs'));
        await logging.PrintLogs(path.join(STEAM_CMD, '..', 'logs'));
    } catch (error) {
        core.error(error);
    }
};

module.exports = { Run }

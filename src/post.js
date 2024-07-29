const core = require('@actions/core');
const logging = require('./logging');
const path = require('path');

async function Run() {
    try {
        await logging.PrintLogs(path.join(process.env.RUNNER_TEMP, '.steamworks'));
        await logging.PrintLogs(path.join(process.env.STEAM_CMD, '..'));
    } catch (error) {
        core.error(error.message);
    }
};

module.exports = { Run }

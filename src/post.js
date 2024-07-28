const core = require('@actions/core');
const exec = require('@actions/exec');

async function Run() {
    try {
        // TODO Implement step cleanup and removing STEAM_DIR/config/config.vdf
        await exec.exec('echo "Hello, World!"');
    } catch (error) {
        core.setFailed(error.message);
    }
};

module.exports = { Run }
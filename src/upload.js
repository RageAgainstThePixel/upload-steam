const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs/promises');
const path = require('path');
const steamTotp = require('steam-totp');
const logging = require('./logging');

const steamcmd = 'steamcmd';
const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = path.join(process.env.STEAM_CMD, '..');
const WORKSPACE = process.env.GITHUB_WORKSPACE;
const RUNNER_TEMP = process.env.RUNNER_TEMP;
const steamworks = path.join(RUNNER_TEMP, '.steamworks');
const build_output = path.join(steamworks, 'buildoutput');

async function Run() {
    let fail = undefined;
    let printLogs = core.isDebug();

    try {
        const args = await getCommandArgs();
        await exec.exec(steamcmd, args);
    } catch (error) {
        printLogs = true;
        fail = error;
    }

    if (printLogs) {
        await logging.PrintLogs(steamworks);
        await logging.PrintLogs(path.join(STEAM_CMD, 'logs'));
    }

    if (fail) {
        core.setFailed(fail);
    }
}

module.exports = { Run }

async function getCommandArgs() {
    if (!STEAM_DIR) {
        throw new Error('STEAM_DIR is not defined.');
    }

    let args = [];
    const username = core.getInput('username', { required: true });
    args.push('+login', username);
    let isLoggedIn = await verify_login(STEAM_DIR);

    if (!isLoggedIn) {
        const config = core.getInput('config');
        if (config) {
            const ssfn = core.getInput('ssfn');
            if (ssfn) {
                const ssfnName = core.getInput('ssfn_name', { required: true });
                const ssfnPath = path.join(STEAM_DIR, ssfnName);
                await fs.writeFile(ssfnPath, Buffer.from(ssfn, 'base64'));
            }
            await fs.writeFile(configPath, Buffer.from(config, 'base64'));
            await fs.access(configPath, fs.constants.R_OK);
        } else {
            const password = core.getInput('password', { required: true });
            let code = core.getInput('code');
            if (!code) {
                const shared_secret = core.getInput('shared_secret', { required: true });
                code = steamTotp.generateAuthCode(shared_secret);
            }
            args.push(password, '+set_steam_guard_code', code);
        }
    }

    let appBuildPath = core.getInput('app_build');

    if (appBuildPath) {
        await fs.access(appBuildPath, fs.constants.R_OK);
        args.push('+run_app_build', appBuildPath, '+quit');
        return args;
    }

    let workshopItemPath = core.getInput('workshop_item');

    if (workshopItemPath) {
        await fs.access(workshopItemPath, fs.constants.R_OK);
        args.push('+workshop_build_item', workshopItemPath, '+quit');
        return args;
    }

    const appId = core.getInput('app_id', { required: true });
    const contentRoot = core.getInput('content_root') || WORKSPACE;
    await fs.access(contentRoot, fs.constants.R_OK);
    const description = core.getInput('description');

    const workshopItemId = core.getInput('workshop_item_id');

    if (workshopItemId) {
        workshopItemPath = await generateWorkshopItemVdf(appId, workshopItemId, contentRoot, description);
        args.push('+workshop_build_item', workshopItemPath, '+quit');
        return args;
    }

    const set_live = core.getInput('set_live');

    const depot_file_exclusions = core.getInput('depot_file_exclusions');
    let depot_file_exclusions_list = undefined;

    if (depot_file_exclusions) {
        depot_file_exclusions_list = depot_file_exclusions.split('\n');
    }

    const install_scripts = core.getInput('install_scripts');
    let install_scripts_list = undefined;

    if (install_scripts) {
        install_scripts_list = install_scripts.split('\n');
    }

    const depots = core.getInput('depots');
    let depots_list = undefined;

    if (depots) {
        depots_list = depots.split('\n');
    }

    appBuildPath = await generateBuildVdf(appId, contentRoot, description, set_live, depot_file_exclusions_list, install_scripts_list, depots_list);
    args.push('+run_app_build', appBuildPath, '+quit');
    return args;
};

async function generateWorkshopItemVdf(appId, workshopItemId, contentRoot, description) {
    await verify_temp_dir();
    const workshopItemPath = path.join(steamworks, 'workshop_item.vdf');
    let workshopItem = `"workshopitem"\n{\n\t"appid" "${appId}"\n\t"publishedfileid" "${workshopItemId}"\n\t"contentfolder" "${contentRoot}"\n`;
    if (description) {
        workshopItem += `\t"description" "${description}"\n`;
    }
    workshopItem += '}';
    core.info(workshopItem);
    await fs.writeFile(workshopItemPath, workshopItem);
    await fs.access(workshopItemPath, fs.constants.R_OK);
    return workshopItemPath;
};

async function generateBuildVdf(appId, contentRoot, description, set_live, depot_file_exclusions_list, install_scripts_list, depots_list) {
    await verify_temp_dir();
    const appBuildPath = path.join(steamworks, 'app_build.vdf');
    let appBuild = `"AppBuild"\n{\n`;
    appBuild += `\t"appid" "${appId}"\n`;
    appBuild += `\t"ContentRoot" "${contentRoot}"\n`;
    appBuild += `\t"BuildOutput" "${build_output}"\n`;
    if (description) {
        appBuild += `\t"Desc" "${description}"\n`;
    }
    if (set_live) {
        appBuild += `\t"SetLive" "${set_live}"\n`;
    }
    if (depots_list) {
        appBuild += `\t"Depots"\n\t{\n`;
        let depotIndex = 1;
        depots_list.forEach(depot => {
            appBuild += `\t\t"${appId + depotIndex}" "${depot}"\n`;
            depotIndex++;
        });
        appBuild += `\t}\n`;
    } else {
        appBuild += `\t"Depots"\n\t{\n`;
        appBuild += `\t\t"DepotID" "${appId + 1}"\n`;
        appBuild += `\t\t"FileMapping"\n\t\t{\n`;
        appBuild += `\t\t\t"LocalPath" "*" // all files from content root folder\n`;
        appBuild += `\t\t\t"DepotPath" "." // mapped into the root of the depot\n`;
        appBuild += `\t\t\t"recursive" "1" // include all subfolders\n`;
        appBuild += `\t\t}\n`;
        appBuild += `\t\t"FileExclusion" "*.pdb" // don't include symbols\n`;
        appBuild += `\t\t"FileExclusion" "**/*_BurstDebugInformation_DoNotShip*" // don't include unity build folders\n`;
        appBuild += `\t\t"FileExclusion" "**/*_BackUpThisFolder_ButDontShipItWithYourGame*" // don't include unity build folders\n`;

        if (depot_file_exclusions_list) {
            depot_file_exclusions_list.forEach(exclusion => {
                appBuild += `\t\t"FileExclusion" "${exclusion}"\n`;
            });
        }

        if (install_scripts_list) {
            install_scripts_list.forEach(script => {
                appBuild += `\t\t"InstallScript" "${script}"\n`;
            });
        }

        appBuild += `\t}\n`;
    }

    appBuild += '}';
    core.info(appBuild);
    await fs.writeFile(appBuildPath, appBuild);
    await fs.access(appBuildPath, fs.constants.R_OK);
    return appBuildPath;
}

async function verify_login(directory) {
    const configPath = path.join(directory, 'config', 'config.vdf');

    try {
        await fs.access(configPath, fs.constants.R_OK);
        return true;
    } catch (error) {
        if (directory === STEAM_CMD) { return false; }
        return await verify_login(STEAM_CMD);
    }
}

async function verify_temp_dir() {
    try {
        await fs.access(steamworks, fs.constants.R_OK);
        await fs.rm(steamworks, { recursive: true });
    } catch (error) {
        // do nothing
    }
    await fs.mkdir(steamworks);
    await fs.mkdir(build_output);
}

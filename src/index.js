const core = require('@actions/core');
const upload = require('./upload');
const post = require('./post');
const IsPost = !!core.getState('isPost');

const main = async () => {
    if (!IsPost) {
        core.info('Uploading mod to Steam Workshop...');
        core.saveState('isPost', 'true');
        await upload.Run();
    } else {
        core.info('Finishing up...');
        await post.Run();
    }
}

main();

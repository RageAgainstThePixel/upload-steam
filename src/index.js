const core = require('@actions/core');
const upload = require('./upload');
const post = require('./post');
const IsPost = !!core.getState('isPost');

const main = async () => {
    if (!IsPost) {
        await upload.Run();
    } else {
        await post.Run();
    }
}

main();

require("dotenv").config()

module.exports = (options, loaderContext) => {
    return { code: 'module.exports = "' + process.env.CLIENT_ID + '"'};
};

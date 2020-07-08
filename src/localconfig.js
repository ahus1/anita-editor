// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

module.exports = () => ({ code: `module.exports = "${process.env.CLIENT_ID}"` });

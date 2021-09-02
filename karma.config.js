// from https://mike-ward.net/2015/09/07/tips-on-setting-up-karma-testing-with-webpack/
// TODO since we have 2 entrypoints in this repo, we should test the first one first.
// and maybe create another one in another files.
var webpackConfig = require('./webpack.config.js')[0];
webpackConfig.entry = {};
module.exports = function (config) {
    config.set({
        plugins: [
            'karma-webpack',
            'karma-jasmine',
            'karma-chrome-launcher',
        ],
        // I'm starting a headless browser, but I can also swap this out for "Chrome" to add debug statements,
        // inspect console logs etc.
        browsers: ['ChromeHeadless'],
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
        // You may need to tweak this patter to find your test files/
        files: ['./karma-setup.js', 'src/**/__tests__/**/*.js'],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            './src/deriv_api/DerivAPIBasic.js': ['webpack'],
            './karma-setup.js': ['webpack'],
            // Use webpack to bundle our tests files
            'src/**/__tests__/**/*.js': ['webpack'],
        },
        webpack: webpackConfig,
    });
};

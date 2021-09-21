/* eslint-disable */
const StringReplacePlugin = require("string-replace-webpack-plugin");
const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin");

const webpack = require("webpack");

module.exports = {
    configureWebpack: {
        optimization: {
            splitChunks: {
                chunks: 'all'
            }
        },
        plugins: [new StringReplacePlugin()]
    },
    chainWebpack: (config) => {
        config.module
            .rule("worker")
            .test(/-worker\.js$/)
            .use('worker-loader')
            .loader('worker-loader')
            .tap(options => {
                return {
                    worker: "SharedWorker",
                    esModule: false
                    // inline: "fallback",
                    // chunkFilename: "[id].[contenthash].worker.js",
                    // filename: "[name].[contenthash].worker.js",
                };
            })
            .end();

        config.module
            .rule("vue_js")
            .test(/\.(js|vue)$/)
            .pre()
            .use("string-replace-loader")
            .loader(
                StringReplacePlugin.replace({
                    replacements: [
                        {
                            pattern: /(#{apiUrl})#/gi,
                            replacement: function (match, p1, offset, string) {
                                //return 'https://localhost:5001';
                                return "//shackleton-sms.azureedge.net";
                            },
                        },
                        {
                            pattern: /(#{cdnUrl})#/gi,
                            replacement: function (match, p1, offset, string) {
                                return "https://shackleton-media.azureedge.net";
                            },
                        },
                        // {
                        //     pattern: /(#{envsuffix})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         return "-tst";
                        //     },
                        // },
                        // {
                        //     pattern: /(#{rayGunKey})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         return "AfWIhxvUD0CCPErBoHKTA";
                        //     },
                        // },
                        // ,
                        // {
                        //     pattern: /(#{functionUrl})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         // return "https://ic-functions-dev.azurewebsites.net";
                        //         return "https://ic-functions-dev-testing.azurewebsites.net";
                        //     },
                        // },
                        // {
                        //     pattern: /(#{imgUrl})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         // return "https://ic-functions-dev.azurewebsites.net";
                        //         return "https://testing-functions.azureedge.net";
                        //     },
                        // }
                        // ,
                        // {
                        //     pattern: /(#{functionKey})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         return "Zqpn9pUat2e3WRdUflkLlVWQSs7RhycdNPaKaEtRPScbNNkALenFvg==";
                        //     },
                        // },

                        // {
                        //     pattern: /(#{couchUrl})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         return "https://couchdb.informcloud.net:6984";
                        //     },
                        // },

                        // {
                        //     pattern: /(#{couchWithCreds})#/gi,
                        //     replacement: function (match, p1, offset, string) {
                        //         return "https://NPIAdmin:9]-qlmCqCv$_@couchdb.informcloud.net:6984";
                        //     },
                        // },
                    ],
                })
            )
            .end();
    },
    assetsDir: "assets",
    runtimeCompiler: true,
    transpileDependencies: ["vuetify"],
    parallel: false,
    devServer: {
        port: 8485
    },
    pluginOptions: {
        "style-resources-loader": {
            preProcessor: "scss",
            patterns: [],
        },
    },
    css: {
        extract: false,
    }
};
const path = require("path");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    mode: "development",
    devtool: "inline-source-map",

    module: {
        rules: [
            {
                test: /\.ts$/,
                include: [
                    path.join(__dirname, "src")
                ],
                loader: "ts-loader"
            },
            {
                test: /\.+$/,
                include: [
                    path.join(__dirname, "src")
                ],
                loader: "file-loader",
                options: {
                    name: "[name].[ext]"
                }
            }
        ]
    },

    entry: {
        "main.js": "./src/main.ts"
    },
    
    output: {
        filename: "[name]",
        path: __dirname + "/out"
    },

    resolve: {
        extensions: [".ts"],
        plugins: [new TsconfigPathsPlugin()]
    }
};
const path = require("path");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    mode: "development",
    // devtool: "inline-source-map",

    module: {
        rules: [
            {
                test: /\.ts$/,
                include: [
                    path.join(__dirname, "src"),
                    // path.join(__dirname, "tests")
                ],
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.json",
                        }
                    }
                ]
            },
        ]
    },

    entry: {
        main: "./src/main.ts",
        // tests: "./tests/tests.ts"
    },
    
    output: {
        filename: "[name].js",
        path: __dirname + "/out"
    },

    resolve: {
        extensions: [".ts"],
        plugins: [new TsconfigPathsPlugin({
            configFile: "tsconfig.json"
        })]
    }
};
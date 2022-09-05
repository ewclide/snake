const path = require('path');

const config = {
    entry: {
        bundle: './src/index',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        publicPath: '',
        library: 'ts_example',
        libraryTarget: 'var',
        chunkFilename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    plugins: [],
    devServer: {
        host: '0.0.0.0',
        port: 3000,
        inline: true,
        contentBase: 'public',
        overlay: {
            warnings: true,
            errors: true
        }
    }
};

module.exports = config;

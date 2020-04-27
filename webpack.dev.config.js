const path = require("path");
const Webpack = require("Webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// 拷贝插件
const CopyWebpackPlugin = require("copy-webpack-plugin");
// 定义cesium源码目录
const cesiumSource = "node_modules/cesium/Source";
const cesiumWorkers = "../Build/Cesium/Workers";

module.exports = {
	mode: "development",
	entry: "./src/index.js",
	output: {
		filename: "ZVMap3D.min.js",
		path: path.resolve(__dirname, "map3D"),
		chunkFilename: "chunk.js",
		//需要编译Cesium中的多行字符串
		sourcePrefix: "",
		// library: "Map3D", //库名
		libraryTarget: "window" //全局挂载
	},
	amd: {
		//允许Cesium兼容 webpack的require方式
		toUrlUndefined: true
	},
	node: {
		fs: "empty"
	},
	devServer: {
		port: "3000",
		progress: true,
		compress: true,
		open: false,
		contentBase: "./src"
	},
	resolve: {
		alias: {
			cesium: path.resolve(__dirname, cesiumSource)
		}
	},
	// webpack的所有插件配置 数组
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/index.html",
			filename: "index.html"
		}),
		new Webpack.DefinePlugin({
			//Cesium加载静态文件的URL相对路径
			CESIUM_BASE_URL: JSON.stringify("./static")
		})
	],
	module: {
		// Critical dependency
		unknownContextCritical: false,
		rules: [
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader", "postcss-loader"]
			},
			{
				test: /\.less$/,
				use: ["style-loader", "css-loader", "postcss-loader", "less-loader"]
			},
			{
				test: /\.(png|gif|jpg|jpeg|svg|xml)$/,
				use: ["url-loader"]
			},
			{
				test: /.js$/,
				exclude: /node_modules/,
				// include: path.resolve(__dirname, cesiumSource),
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: ["@babel/preset-env"]
						}
					}
					// {
					//     loader: "strip-pragma-loader", //去除cesium的一些开发错误和警告信息
					//     options: {
					//         pragmas: {
					//             debug: false,
					//         },
					//     },
					// },
				]
			}
		]
	},
	//性能配置
	performance: {
		hints: "warning", // 枚举
		maxAssetSize: 30000000, // 整数类型（以字节为单位）
		maxEntrypointSize: 50000000, // 整数类型（以字节为单位）
		assetFilter: (assetFilename) => {
			// 提供资源文件名的断言函数
			return assetFilename.endsWith(".css") || assetFilename.endsWith(".js");
		}
	}
};

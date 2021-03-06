const path = require("path");
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// 拷贝插件
const Webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// 定义cesium源码目录
const cesiumSource = "node_modules/cesium/Source";
const cesiumWorkers = "../Build/Cesium/Workers";

module.exports = {
	mode: "production",
	entry: "./src/index.js",
	output: {
		filename: "ZVMap3D.min.js",
		path: path.resolve(__dirname, "map3D"),
		chunkFilename: "Cesium.chunk.js",
		//需要编译Cesium中的多行字符串
		sourcePrefix: "",
		// library: "Map3D", //库名
		libraryTarget: "window" //全局挂载
	},
	amd: {
		// 允许Cesium兼容 webpack的require方式
		toUrlUndefined: true
	},
	node: {
		fs: "empty"
	},
	resolve: {
		alias: {
			cesium: path.resolve(__dirname, cesiumSource)
		}
	},
	// externals: [],  不打包的库
	// webpack的所有插件配置 数组
	plugins: [
		// 拷贝Cesium下的静态目录
		new CopyWebpackPlugin([{ from: path.join(cesiumSource, "Widgets"), to: "Widgets" }]),
		new CopyWebpackPlugin([{ from: path.join(cesiumSource, "Assets"), to: "Assets" }]),
		new CopyWebpackPlugin([{ from: path.join(cesiumSource, cesiumWorkers), to: "Workers" }]),
		new CleanWebpackPlugin(),
		new Webpack.BannerPlugin("版权所有，翻版必究")
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
							cacheDirectory: true, //缓存babel-loader编译结果,下次编译时读取缓存提高效率
							presets: ["@babel/preset-env"],
							plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties"]
						}
					},
					{
						loader: "strip-pragma-loader", //去除cesium的一些开发错误和警告信息
						options: {
							pragmas: {
								debug: false
							}
						}
					}
				]
			}
		]
	},
	//性能配置
	performance: {
		hints: "error", // 枚举 false | "error" | "warning"
		maxAssetSize: 30000000, // 资源(asset)是从 webpack 生成的任何文件 整数类型（字节bytes）
		maxEntrypointSize: 50000000, // 入口起点的最大体积 整数类型（字节bytes）
		assetFilter: (assetFilename) => {
			// 提供资源文件名的断言函数
			return assetFilename.endsWith(".css") || assetFilename.endsWith(".js");
		}
	},
	optimization: {
		// 代码分割
		splitChunks: {
			// name: false, //为true时,Chunk包将以cacheGroups的key命名
			// cacheGroups: {
			// vendor: {
			// chunks: "all",
			// name: "Cesium", //chunk代码块的名称 output指定名称时以output配置为准
			// test: /[\\/]node_modules[\\/]/ // 匹配 node_modules 下的模块
			// minChunks: 1, // 模块的最小被引用次数
			// minSize: 30000 // 模块的最小体积 bytes
			// }
			// }
		},
		minimizer: [
			new TerserWebpackPlugin({
				cache: true,
				// 开启多线程
				parallel: true,
				sourceMap: false,
				terserOptions: {
					// 打包时将无用代码去除
					compress: {
						unused: true,
						drop_debugger: true,
						drop_console: true,
						dead_code: true
					}
				}
			})
		]
	}
};

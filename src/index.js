import Cesium from "cesium/Cesium";
import CesiumNavigation from "cesium-navigation-es6";
require("cesium/Widgets/widgets.css");
require("./index.less");
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNjM2OGFlOC1lZDY4LTQ2NjQtODQ2Yi1iYTM0YTQzNGE3OWEiLCJpZCI6MjYyMzAsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODc0NTQ3NDB9.9KgD-eLN196Tz-eDSA_NLt33E2QyditDcTTEjh4L_TA";
const EVENTS_MAP = {
	click: "LEFT_CLICK",
	dbclick: "LEFT_DOUBLE_CLICK",
	mousedown: "LEFT_DOWN",
	mouseup: "LEFT_UP",
	mousemove: "MOUSE_MOVE",
	mousewheel: "WHEEL"
};
export class Map3D {
	constructor(divId, BASE_URL) {
		window.CESIUM_BASE_URL = BASE_URL || "";
		this.divId = divId;
		//事件句柄集合
		this.eventHandler = {};
		this.viewer = null;
	}
	initMap(config) {
		//创建cesium Viewer场景
		this.viewer = new Cesium.Viewer(this.divId, {
			//是否创建动画小器件，左下角仪表
			animation: config.animation || false,
			//是否显示图层选择器
			baseLayerPicker: config.baseLayerPicker || false,
			//是否显示全屏按钮
			fullscreenButton: config.fullscreenButton || false,
			// 是否显示VR按钮
			vrButton: config.vrButton || false,
			//是否显示geocoder小器件，右上角查询按钮
			geocoder: config.geocoder || false,
			//是否显示Home按钮
			homeButton: config.homeButton || false,
			//是否显示信息框
			infoBox: config.infoBox || false,
			//是否显示3D/2D选择器
			sceneModePicker: config.sceneModePicker || false,
			//是否显示选取指示器组件
			selectionIndicator: config.selectionIndicator || false,
			//是否显示时间轴
			timeline: config.timeline || false,
			//是否显示右上角的帮助按钮
			navigationHelpButton: config.navigationHelpButton || false,
			//如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
			scene3DOnly: true,
			navigationInstructionsInitiallyVisible: false,
			showRenderLoopErrors: false,
			//加载自定义地图瓦片需要指定一个自定义图片服务器 例如指定OpenStreetMapImagerProvider
			//URL 为瓦片数据服务器地址
			imageryProvider: config.templateImageLayerUrl
				? new Cesium.UrlTemplateImageryProvider({
						url: config.templateImageLayerUrl
						// url: "/gis/{z}/{x}/{y}.png"
						// url: "http://t2.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=b0b6f6127490e1226b057bf3e90dfa45"
						// maximumLevel: 22,
						// minimumLevel: 18
				  })
				: null
			// // targetFrameRate: 1,
			// 初始场景模式 默认SceneMode.SCENE3D
			// sceneMode: Cesium.SceneMode.SCENE2D,
			// mapProjection: new Cesium.WebMercatorProjection()
		});
		// 隐藏左下角的logo
		this.viewer._cesiumWidget._creditContainer.style.display = "none";
		// 启用地球照明
		this.viewer.scene.globe.enableLighting = config.enableLighting ? true : false;
		// 开启阴影
		this.viewer.shadows = config.enableShadows ? true : false;
		// 开启深度检测,隐藏地形以下
		this.viewer.scene.globe.depthTestAgainstTerrain = true;

		// 显示坐标
		config.showLatLonHeight && this.createLocationPanel();
		// 显示导航插件
		config.enableNavigation && this.showNavigation();
		// 加载单个图层的地址
		if (config.singleImageLayerUrl) {
			this.viewer.imageryLayers.addImageryProvider(
				new Cesium.SingleTileImageryProvider({
					url: config.singleImageLayerUrl,
					rectangle: new Cesium.Rectangle(Cesium.Math.toRadians(-180), Cesium.Math.toRadians(-90), Cesium.Math.toRadians(180), Cesium.Math.toRadians(90))
				})
			);
		}
		// 禁止相机穿地
		this.disableCameraToGround();
	}
	// 显示罗盘、指南针
	showNavigation() {
		let options = {};
		// 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和Cesium.Rectangle.
		// options.defaultResetView = Cesium.Cartographic.fromDegrees(lon,lat,height);
		// 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
		options.enableCompass = true;
		// 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件 将不会添加到地图中。
		options.enableZoomControls = true;
		// 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
		options.enableDistanceLegend = true;
		// 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
		options.enableCompassOuterRing = true;
		CesiumNavigation(this.viewer, options);
		// 手动修改插件放大、缩小按钮的title属性
		document.querySelector(".navigation-control-icon-zoom-in").parentElement.title = "放大";
		document.querySelector(".navigation-control-icon-zoom-out").parentElement.title = "缩小";

		// 创建div 覆盖插件的重置按钮,添加自定义点击事件,确保能够飞行之指定方位
		let div = document.createElement("div");
		div.setAttribute("class", "reset-button");
		div.setAttribute("title", "重置视图");
		document.querySelector(".navigation-controls").appendChild(div);
		div.onclick = () => {
			this.cameraFlyTo({
				lon: 108.9654177,
				lat: 34.2630702,
				height: 203.53703876812398,
				heading: 335.7402975,
				pitch: -29.8306133,
				duration: 2
			});
		};
	}
	// 创建显示坐标面板
	createLocationPanel() {
		let dom = document.querySelector("#latlng");
		if (dom) {
			dom.style.visibility = "visible";
		} else {
			let dom = document.createElement("div");
			const html = '<div id="latlng" style="height: 30px;line-height: 30px;position: fixed;bottom: 50px;right: 100px;background-color: rgba(68, 62, 62, 0.55);color: white;z-index: 2;">经度：<span id="longitude"></span>&nbsp;&nbsp; 纬度：<span id="latitude"></span>&nbsp;&nbsp; 视角高：<span id="altitude"></span>km</div>';
			dom.innerHTML = html;
			document.body.appendChild(dom);
			this.showMouseLocation();
		}
	}
	/**
	 * 是否隐藏坐标面板
	 * 该方法不会删除Dom节点
	 * @params isShow boolean true显示 false隐藏
	 * @memberof Map3D
	 */
	hideLocationPanel(isShow) {
		let dom = document.querySelector("#latlng");
		if (dom) {
			dom.style.visibility = isShow ? "visible" : "hidden";
		}
	}
	// 显示鼠标的移动坐标
	showMouseLocation() {
		let self = this;
		let longitude = document.getElementById("longitude");
		let latitude = document.getElementById("latitude");
		let altitude = document.getElementById("altitude");
		//具体事件的实现
		let ellipsoid = this.viewer.scene.globe.ellipsoid;
		this.registerEvent("mousemove", (movement) => {
			//捕获椭球体，将笛卡尔二维平面坐标转为椭球体的笛卡尔三维坐标，返回球体表面的点
			let cartesian = self.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
			if (cartesian) {
				//将笛卡尔三维坐标转为地图坐标（弧度）
				let cartographic = self.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
				//将地图坐标（弧度）转为十进制的度数
				let lat_String = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
				let log_String = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
				let alti_String = (self.viewer.camera.positionCartographic.height / 1000).toFixed(2);
				longitude.innerHTML = log_String;
				latitude.innerHTML = lat_String;
				altitude.innerHTML = alti_String;
			}
		});
	}
	/**
	 *设置相机视角
	 * @param {*} { lon 经度, lat 纬度, height 高度, heading 方位角, pitch 倾斜角 }
	 * @memberof Map3D
	 */
	setView({ lon, lat, height, heading, pitch }) {
		this.viewer.camera.setView({
			destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
			orientation: {
				heading: Cesium.Math.toRadians(heading),
				pitch: Cesium.Math.toRadians(pitch),
				roll: 0.0
			}
		});
	}
	// 相机飞行
	cameraFlyTo({ lon, lat, height, heading, pitch, duration }) {
		this.viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
			orientation: {
				heading: Cesium.Math.toRadians(heading),
				pitch: Cesium.Math.toRadians(pitch),
				roll: 0.0
			},
			duration: duration
		});
	}
	// 获取模型合适视角
	getModelView() {
		this.registerEvent("click", (lclickment) => {
			// 获取鼠标选中的对象的笛卡尔坐标
			var cameraPosition = this.viewer.camera.position;
			// 获取鼠标选中的对象
			if (cameraPosition) {
				//将笛卡尔三维坐标转为地图坐标（弧度）
				var cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cameraPosition);
				//将地图坐标（弧度）转为十进制的度数
				var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
				var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
				var altitude = cartographic.height.toFixed(7);
				// 方位角
				var heading = Cesium.Math.toDegrees(this.viewer.camera.heading).toFixed(7);
				//倾斜角
				var pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch).toFixed(7);
				console.log(
					"当前的相机视角==",
					JSON.stringify({
						latitude: latitude,
						longitude: longitude,
						height: altitude,
						heading: heading,
						pitch: pitch
					})
				);
			}
		});
	}
	/**
	 *
	 *
	 * @param {*} {id 唯一标识, lon 经度,lat 纬度,height 高度, url 模型的相对地址, scale 模型的放大比例}
	 * @returns Primitives
	 * @memberof Map3D
	 */
	addModel({ id, lontitude, latitude, height, url, scale }) {
		// 将经纬度转换为世界坐标
		// 纬度越大 越往上,经度越大越往右 主模型的经纬度需要硬编码
		// 模型默认加载的经纬度坐标
		var origin = Cesium.Cartesian3.fromDegrees(lontitude, latitude, height);
		// 矩阵转换
		var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
		// //计算从以提供的原点为中心的参考帧到提供的椭球的固定参考帧的4x4变换矩阵
		// var fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');
		var model = this.viewer.scene.primitives.add(
			Cesium.Model.fromGltf({
				id: id,
				url: url,
				show: true,
				// modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
				modelMatrix: modelMatrix,
				scale: scale || 1,
				minimumPixelSize: 0, //最小像素
				// maximumScale: 20, //最大比例
				// 是否允许拾取
				allowPicking: true
			})
		);
		//模型加载完成后的回调函数
		// model.readyPromise.then(function (model) {
		// });
		return model;
	}
	/**
	 * 添加聚合点位
	 * @param {*} markers
	 * @memberof Map3D
	 */
	addClusterMarkers(markers) {
		// 自定义数据源
		let clusterMarkers = new Cesium.CustomDataSource("clusterMarkers");
		// 将图标点添加到自定义的数据源中
		this.addMarkers(markers, clusterMarkers);
		let dataSourcePromise = this.viewer.dataSources.add(clusterMarkers);
		dataSourcePromise.then((dataSource) => {
			// 像素范围
			var pixelRange = 20;
			// 最小聚合的个数
			var minimumClusterSize = 10;
			dataSource.clustering.enabled = true;
			dataSource.clustering.pixelRange = pixelRange;
			dataSource.clustering.minimumClusterSize = minimumClusterSize;
			var removeListener;
			var pinBuilder = new Cesium.PinBuilder();
			var pin50 = pinBuilder.fromText("50+", Cesium.Color.RED, 48).toDataURL();
			var pin40 = pinBuilder.fromText("40+", Cesium.Color.ORANGE, 48).toDataURL();
			var pin30 = pinBuilder.fromText("30+", Cesium.Color.YELLOW, 48).toDataURL();
			var pin20 = pinBuilder.fromText("20+", Cesium.Color.GREEN, 48).toDataURL();
			var pin10 = pinBuilder.fromText("10+", Cesium.Color.BLUE, 48).toDataURL();
			var singleDigitPins = new Array(8);
			for (var i = 0; i < singleDigitPins.length; ++i) {
				singleDigitPins[i] = pinBuilder.fromText("" + (i + 2), Cesium.Color.VIOLET, 48).toDataURL();
			}
			function customStyle() {
				if (Cesium.defined(removeListener)) {
					removeListener();
					removeListener = undefined;
				} else {
					removeListener = dataSource.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
						cluster.label.show = false;
						cluster.billboard.show = true;
						cluster.billboard.id = cluster.label.id;
						cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
						if (clusteredEntities.length >= 50) {
							cluster.billboard.image = pin50;
						} else if (clusteredEntities.length >= 40) {
							cluster.billboard.image = pin40;
						} else if (clusteredEntities.length >= 30) {
							cluster.billboard.image = pin30;
						} else if (clusteredEntities.length >= 20) {
							cluster.billboard.image = pin20;
						} else if (clusteredEntities.length >= 10) {
							cluster.billboard.image = pin10;
						} else {
							cluster.billboard.image = singleDigitPins[clusteredEntities.length - 2];
						}
					});
				}
				//重写聚合像素范围
				let pixelRange = dataSource.clustering.pixelRange;
				dataSource.clustering.pixelRange = 0;
				dataSource.clustering.pixelRange = pixelRange;
			}
			//聚合点位样式
			customStyle();
		});
	}
	/**
	 *添加图标广告牌 markers
	 * @param {*} object array {
	 *  id 唯一id,
	 *  lon 经度,
	 *  lat 纬度,
	 *  height 高度,
	 *  labelText 图标上显示的文字,
	 *  image {url: 图标url地址,width: 图标的宽, height: 图标的高},
	 *  dataSource 数据源 聚合点位时可以用到
	 * }
	 * @memberof Map3D
	 */
	addMarkers(markers, dataSource) {
		if (markers.length) {
			var entities = [];
			markers.forEach((marker, index) => {
				var position = Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, marker.height);
				var heading = Cesium.Math.toRadians(0);
				var pitch = Cesium.Math.toRadians(0.0);
				var hpr = new Cesium.HeadingPitchRoll(heading, pitch, 0.0);
				var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
				var entryObj = {
					id: marker.id,
					fill: false,
					outline: false,
					outlineColor: false,
					name: marker.labelText || "",
					position: position,
					orientation: orientation,
					//文字标签
					label: {
						text: marker.labelText || "",
						font: "14pt monospace",
						outlineWidth: 20,
						fillColor: Cesium.Color.BLACK,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM, //垂直方向以底部来计算标签的位置
						pixelOffset: new Cesium.Cartesian2(0, -15) //偏移量
					},
					billboard: {
						//图标
						image: marker.image.url || "",
						width: marker.image.width || 20,
						height: marker.image.height || 20
					}
				};
				entities[index] = dataSource ? dataSource.entities.add(entryObj) : this.viewer.entities.add(entryObj);
			});
			return entities;
		}
	}
	// 通过id隐藏markers
	hideMarkerByIds(ids) {
		ids &&
			ids.length &&
			ids.forEach((id) => {
				let marker = this.viewer.entities.getById(id);
				marker && (marker.show = marker.show ? false : true);
			});
	}
	// 通过id删除markers
	removeMarkerByIds(ids) {
		ids &&
			ids.length &&
			ids.forEach((id) => {
				this.viewer.entities.removeById(id);
			});
	}
	// 移除所有marker
	removeAllMarkers() {
		this.viewer.entities.removeAll();
	}
	/**
	 * 删除指定的marker
	 * @param {*} marker Marker实体
	 * @memberof Map3D
	 */
	removeMarker(marker) {
		this.viewer.entities.remove(marker);
	}
	/**
	 *批量设置marker的颜色
	 * @param {*} markerIds 图标点的id集合 [string]
	 * @param {*} color 颜色值 支持['red', #999999, rgba(155,213,25,0.5)]
	 * @memberof Map3D
	 */
	setColor(markerIds, color) {
		markerIds &&
			markerIds.length &&
			markerIds.forEach((markerId) => {
				let marker = this.viewer.entities.getById(markerId);
				if (marker) {
					marker._billboard.color = Cesium.Color.fromCssColorString(color);
				}
			});
	}
	/**
	 *重置marker颜色
	 * @param {*} markerIds 图标点id集合
	 * @memberof Map3D
	 */
	resetColor(markerIds) {
		markerIds &&
			markerIds.length &&
			markerIds.forEach((markerId) => {
				let marker = this.viewer.entities.getById(markerId);
				if (marker) {
					marker._billboard.color = Cesium.Color.WHITE;
				}
			});
	}
	/**
	 * 判断集合种是否存在marker
	 * @param {*} marker marker对象
	 * @returns Boolean true存在 false 不存在
	 * @memberof Map3D
	 */
	containsMarker(marker) {
		let isContain = this.viewer.contains(marker);
		return isContain;
	}
	/**
	 * 注册地图事件
	 * @param {*} type 事件类型
	 * @param {*} func 事件触发的函数
	 * @memberof Map3D
	 */
	registerEvent(type, func) {
		if (type && EVENTS_MAP[type]) {
			var canvas = this.viewer.scene.canvas;
			// 事件句柄
			if (!this.eventHandler[type]) {
				this.eventHandler[type] = new Cesium.ScreenSpaceEventHandler(canvas);
				this.eventHandler[type].setInputAction((e) => {
					if (type === "click") {
						let entity = this.viewer.scene.pick(e.position);
						func(entity, e.position);
					} else {
						func(e);
					}
				}, Cesium.ScreenSpaceEventType[EVENTS_MAP[type]]);
			} else {
				this.eventHandler[type].setInputAction((e) => {
					if (type === "click") {
						let entity = this.viewer.scene.pick(e.position);
						func(entity, e.position);
					} else {
						func(e);
					}
				}, Cesium.ScreenSpaceEventType[EVENTS_MAP[type]]);
			}
		}
	}
	/**
	 *  注销地图事件
	 * @param {*} type 事件类型
	 * @memberof Map3D
	 */
	unRegisterEvent(type) {
		if (type && EVENTS_MAP[type]) {
			this.eventHandler[type].removeInputAction(EVENTS_MAP[type]);
			this.eventHandler[type] = null;
		}
	}
	/**
	 *自定义添加infowindow 随地图拖拽移动
	 * @param {*} entity Entity 实体类
	 * @param {*} position 屏幕坐标 {x,y}
	 * @param {*} config infowindow配置信息 {html:String, className:String, offsetX:Number,offsetY: Number}
	 * @memberof Map3D
	 */
	addInfowindow(entity, position, config) {
		const self = this;
		let infoDiv = document.querySelector("#map3d-infowindow");
		// 屏幕坐标转换为笛卡尔坐标
		let cartesian = this.viewer.scene.pickPosition(position);
		if (!infoDiv) {
			infoDiv = document.createElement("div");
			infoDiv.setAttribute("id", "map3d-infowindow");
			infoDiv.className = config.className ? `${config.className} infowindow` : "infowindow";
			let closeIcon = document.createElement("div");
			closeIcon.className = "close-icon";
			closeIcon.innerHTML = "X";
			closeIcon.setAttribute("onclick", "this.parentElement.parentElement.removeChild(document.querySelector('#map3d-infowindow'))");
			infoDiv.appendChild(closeIcon);
			if (config.html) {
				if (typeof config.html === "string") {
					infoDiv.innerHTML = infoDiv.innerHTML ? infoDiv.innerHTML + config.html || "" : "";
				} else if (typeof config.html === "object" && config.html instanceof HTMLElement) {
					infoDiv.append(config.html);
				}
			}
			document.querySelector(`#${this.divId}`).appendChild(infoDiv);
		}
		// 场景帧渲染结束事件
		this.viewer.scene.postRender.addEventListener(() => {
			if (entity.id instanceof Cesium.Entity) {
				let screenPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, cartesian);
				let x = screenPosition.x - (config.offsetX || 0);
				let y = screenPosition.y - (config.offsetY || 0);
				//世界坐标--->屏幕坐标
				infoDiv.style.transform = `translate(${x}px,${y}px)`;
			} else {
				infoDiv.style.transform = "translate(-10000px,-10000px)";
			}
		});
	}
	removeInfoWindow() {
		let parentDom = document.querySelector(`#${this.divId}`);
		let childDom = document.querySelector("#map3d-infowindow");
		if (parentDom && childDom) {
			parentDom.removeChild(childDom);
		}
	}
	// 禁止相机穿地
	disableCameraToGround() {
		const self = this;
		this.viewer.scene.preRender.addEventListener(onPreFrame, self);
		function onPreFrame() {
			if (self.viewer.scene.mode == Cesium.SceneMode.MORPHING) return;
			// 获取相机的高度
			let groundHeightAtCameraPosition = self.viewer.scene.globe.getHeight(self.viewer.camera.positionCartographic);
			if (!groundHeightAtCameraPosition) return;
			self._groundHeightAtCameraPosition = groundHeightAtCameraPosition;
			// 获取地面高度
			self._HeightAboveGround = self.viewer.camera.positionCartographic.height - self._groundHeightAtCameraPosition;
			handleHitGround();
		}
		function handleHitGround() {
			let hitTheGround;
			let adjustedHeight;
			hitTheGround = self._HeightAboveGround < 0;
			adjustedHeight = self._groundHeightAtCameraPosition + 10;
			if (hitTheGround) {
				// 重置相机视角
				self.viewer.camera.setView({
					destination: Cesium.Cartesian3.fromRadians(self.viewer.camera.positionCartographic.longitude, self.viewer.camera.positionCartographic.latitude, adjustedHeight),
					orientation: {
						heading: self.viewer.camera.heading,
						pitch: self.viewer.camera.pitch,
						roll: 0.0
					}
				});
			}
		}
	}
	// line polygon circle rectangle
	startDraw(drawingMode, data, callback) {
		var self = this;
		var activeShapePoints = [];
		var activeShape;
		var floatingPoint;
		var handler = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
		//鼠标左键
		handler.setInputAction((event) => {
			// scene.pickPosition只有在开启地形深度检测，且不使用默认地形时是准确的。
			var earthPosition = self.viewer.scene.pickPosition(event.position);
			if (Cesium.defined(earthPosition)) {
				// 绘制第一个点
				if (activeShapePoints.length === 0) {
					floatingPoint = createPoint(earthPosition);
					activeShapePoints.push(earthPosition);
					var dynamicPositions = new Cesium.CallbackProperty(function () {
						if (drawingMode === "polygon") {
							return new Cesium.PolygonHierarchy(activeShapePoints);
						}
						return activeShapePoints;
					}, false);
					activeShape = drawShape(drawingMode, dynamicPositions); //绘制动态图
				}
				activeShapePoints.push(earthPosition);
				createPoint(earthPosition);
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//鼠标移动
		handler.setInputAction((event) => {
			if (Cesium.defined(floatingPoint)) {
				var newPosition = self.viewer.scene.pickPosition(event.endPosition);
				if (Cesium.defined(newPosition)) {
					floatingPoint.position.setValue(newPosition);
					activeShapePoints.pop();
					activeShapePoints.push(newPosition);
				}
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		// 鼠标右键
		handler.setInputAction((event) => {
			resetDraw(drawingMode);
			handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
			handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
			handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
			handler = null;
			// 判断点位是否在区域内
			// self.isContainedInRect(data, callback);
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
		//绘制点
		function createPoint(worldPosition) {
			var point = self.viewer.entities.add({
				position: worldPosition,
				point: {
					color: Cesium.Color.WHITE,
					pixelSize: 2
					// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
				}
			});
			return point;
		}
		function resetDraw(drawingMode) {
			activeShapePoints.pop();
			drawShape(drawingMode, activeShapePoints);
			self.viewer.entities.remove(floatingPoint);
			self.viewer.entities.remove(activeShape);
			floatingPoint = undefined;
			activeShape = undefined;
			activeShapePoints = [];
		}
		//绘制图形
		function drawShape(mode, positionData) {
			var shape;
			if (mode === "line") {
				shape = self.viewer.entities.add({
					polyline: {
						positions: positionData,
						clampToGround: false, //贴地
						width: 5
					}
				});
			} else if (mode === "polygon") {
				shape = self.viewer.entities.add({
					polygon: {
						height: 30,
						extrudedHeight: 30,
						hierarchy: positionData,
						material: new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW.withAlpha(0.7))
					}
				});
			} else if (mode === "circle") {
				//当positionData为数组时绘制最终图，如果为function则绘制动态图
				var value = typeof positionData.getValue === "function" ? positionData.getValue(0) : positionData;
				shape = self.viewer.entities.add({
					position: activeShapePoints[0],
					name: "Circle",
					height: 10,
					// extrudedHeight: 10,
					ellipse: {
						// 指定半长轴的数值属性
						semiMinorAxis: new Cesium.CallbackProperty(function () {
							//半径 两点间距离
							var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
							return r ? r : r + 1;
						}, false),
						// 指定半短轴的数字属性
						semiMajorAxis: new Cesium.CallbackProperty(function () {
							var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
							return r ? r : r + 1;
						}, false),
						material: Cesium.Color.YELLOW.withAlpha(0.5),
						outline: false
					}
				});
			} else if (mode === "rectangle") {
				//当positionData为数组时绘制最终图，如果为function则绘制动态图
				// 获取矩形两个对角点的笛卡尔坐标
				var arr = typeof positionData.getValue === "function" ? positionData.getValue(0) : positionData;
				console.log("arr===", arr);
				self._rectArr = arr;
				shape = self.viewer.entities.add({
					name: "Rectangle",
					height: 40,
					extrudedHeight: 40, //矩形凸面相对于椭球地面的高度
					rectangle: {
						coordinates: new Cesium.CallbackProperty(function () {
							var obj = Cesium.Rectangle.fromCartesianArray(arr);
							return obj;
						}, false),
						material: Cesium.Color.YELLOW.withAlpha(0.5)
					}
				});
			}
			return shape;
		}
	}
	isContainedInRect(data, callback) {
		var cartographic1 = Cesium.Cartographic.fromCartesian(data[0]);
		// 矩形左上角经纬度
		var position1 = {
			lat: Cesium.Math.toDegress(cartographic1.latitude),
			lon: Cesium.Math.toDegress(cartographic1.longitude)
		};
		var cartographic2 = Cesium.Cartographic.fromCartesian(data[1]);
		// 矩形右下角经纬度
		var position2 = {
			lat: Cesium.Math.toDegress(cartographic2.latitude),
			lon: Cesium.Math.toDegress(cartographic2.longitude)
		};
		var position = [position1, position2];
	}
	//计算两点间距离
	getFlatternDistance(lat1, lng1, lat2, lng2) {
		const EARTH_RADIUS = 6378137.0; //单位M
		const PI = Math.PI;
		function getRad(d) {
			return (d * PI) / 180.0;
		}
		var f = getRad((lat1 + lat2) / 2);
		var g = getRad((lat1 - lat2) / 2);
		var l = getRad((lng1 - lng2) / 2);

		var sg = Math.sin(g);
		var sl = Math.sin(l);
		var sf = Math.sin(f);

		var s, c, w, r, d, h1, h2;
		var a = EARTH_RADIUS;
		var fl = 1 / 298.257;

		sg = sg * sg;
		sl = sl * sl;
		sf = sf * sf;

		s = sg * (1 - sl) + (1 - sf) * sl;
		c = (1 - sg) * (1 - sl) + sf * sl;

		w = Math.atan(Math.sqrt(s / c));
		r = Math.sqrt(s * c) / w;
		d = 2 * w * a;
		h1 = (3 * r - 1) / 2 / c;
		h2 = (3 * r + 1) / 2 / s;

		return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg));
	}
	// 销毁
	destory() {
		this.viewer.destory();
		window.Map3D = null;
	}
}

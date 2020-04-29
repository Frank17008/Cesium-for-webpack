# Cesium-for-webpack

> 1.此文档是 Cesium 结合 Webpack4.x 进行二次封装的 API 文档，可单独打包引入项目工程。

> 2.该项目中引用了指南针插件`cesium-navigation-es6`,由于兼容性问题,此项目 Cesium 的版本为 1.59.0,如果需要安装更高版本,删除该项目中插件引用关系,重新打包即可。

> 3.该项目最终打包生成文件夹`map3D`,其中`ZVMap3D.min.js`通过`script标签`在`index.html`页面引入,其余文件目录是`Cesium`默认的静态资源文件,需引入项目工程下的静态资源目录即可。

> 4.该项目基于 webpack 封装了部分 Cesium 的常用功能,其他功能将后续持续开发及优化。

源码地址:https://github.com/Frank17008/Cesium-for-webpack

## 目录

-   [初始化地图 initMap](#initMap)
-   [隐藏鼠标坐标面板 hideLocationPanel](#hideLocationPanel)
-   [设置相机视角 setView](#setView)
-   [相机视角飞行 cameraFlyTo](#cameraFlyTo)
-   [获取当前相机视角 getModelView](#getModelView)
-   [添加模型 addModel](#addModel)
-   [添加聚合点位 addClusterMarkers](#addClusterMarkers)
-   [添加图标 addMarkers](#addMarkers)
-   [通过 Id 隐藏图标 hideMarkerByIds](#hideMarkerByIds)
-   [通过 Id 删除图标 removeMarkerByIds](#removeMarkerByIds)
-   [删除所有图标 removeAllMarkers](#removeAllMarkers)
-   [删除指定的图标 removeMarker](#removeMarker)
-   [图标颜色设置 setColor](#setColor)
-   [图标颜色重置 resetColor](#resetColor)
-   [是否包含图标 containsMarker](#containsMarker)
-   [地图注册事件 registerEvent](#registerEvent)
-   [地图注销事件 unRegisterEvent](#unRegisterEvent)
-   [添加信息弹框 addInfowindow](#addInfowindow)
-   [删除信息弹框 removeInfoWindow](#removeInfoWindow)
-   [禁止相机入地 disableCameraToGround](#disableCameraToGround)
-   [绘制几何图形 startDraw](#startDraw)
-   [销毁地图 destory](#destory)

## 开始使用

1. ### initMap

HTML 文件

```html
<div id="map"></div>
```

js 文件

```js
let globalMap = new window.Map3D(containerId, staticResourceUrl);
globalMap.initMap({
	showLatLonHeight: true, //显示鼠标移动坐标
	enableNavigation: true, //显示导航插件
	singleImageLayerUrl: "./map-bg.jpg", //加载单张图片做为地图底图
	templateImageLayerUrl: "/gis/{z}/{x}/{y}.png", //加载模板图片图层
	enableLighting: false //是否启用光照照明
	enableShadows: false //是否开启阴影
});
```

备注:<br />
`templateImageLayerUrl`: 与`singleImageLayerUrl`只能二选其一<br />
`enableLighting`: Cesium 默认采用的是格林威治时间(UTC 时间)<br />
`containerId`: 指定需要初始化 3D 地图的容器 Id<br />
`staticResourceUrl`: 指定 3D 地图加载默认静态资源的路径<br />

[返回目录](#目录)

2. ### hideLocationPanel

```js
globalMap.hideLocationPanel(true); //隐藏
globalMap.hideLocationPanel(false); //显示
```

[返回目录](#目录)

3. ### setView

```js
globalMap.setView({
	lon: 108.9654177, //经度
	lat: 34.2630702, //纬度
	height: 203.53703876812398, //高度
	heading: 335.7402975, //方位角
	pitch: -29.8306133 //倾斜角
});
```

备注:<br />
视角的参数可通过 [getModelView](#getModelView)获取。

[返回目录](#目录)

4. ### cameraFlyTo

```js
globalMap.cameraFlyTo({
	lon: 108.9654177,
	lat: 34.2630702,
	height: 203.53703876812398,
	heading: 335.7402975,
	pitch: -29.8306133,
	duration: 2 //动画时长 2s
});
```

备注: [cameraFlyTo](#cameraFlyTo) 不同于 [setView](#setView) 的是,会存在相机飞行的动画

[返回目录](#目录)

5. ### getModelView

```js
globalMap.getModelView();
```

备注: 该方法只针对与开发环境下调试使用,模型初始化完成后调用该方法,待页面上模型加载完成后,鼠标点击<strong><font color="#2daebf">模型上</font></strong>的任意位置，即可在控制台输出当前相机视角参数。

[返回目录](#目录)

6. ### addModel

```js
let model = globalMap.addModel({
	id: "mainBuilding", //指定模型唯一id
	url: "./model/model.gltf", //模型文件
	lontitude: 108.9625, //经度
	latitude: 34.2685, //纬度
	height: 0 //高度
});
```

[返回目录](#目录)

7. ### addClusterMarkers

```js
var data = [
	{
		id: "camera01",
		lon: 108.963966,
		lat: 34.2656,
		height: 10,
		labelText: "摄像机1",
		image: {
			url: "./image/camera.jpg"
		}
	}
];
for (let i = 50; i < 100; i++) {
	data[i] = {
		id: "camera0" + i,
		lon: data[0].lon + i * 0.002,
		lat: data[0].lat + i * 0.002,
		height: 10,
		labelText: "聚合测试点" + i,
		image: {
			url: "./image/zpj.svg"
		}
	};
}
globalMap.addClusterMarkers(data);
```

备注: 该 API 中的聚合点位样式采用 Cesium 中的`Cesium.PinBuilder`(图钉)类,如需自定义样式需自行扩展

[返回目录](#目录)

8. ### addMarkers

```js
var data = [
	{
		id: "camera01", //图标点唯一id
		lon: 108.963966,
		lat: 34.2656,
		height: 10,
		labelText: "摄像机1", //图标显示的label
		image: {
            url: "./image/camera.jpg" //图标地址 支持svg/png/jpg
            width: 30, //图标宽度
            height: 40 //图标高度
		}
	},
	{
		id: "camera02",
		lon: 108.9637666,
		lat: 34.2654362,
		height: 10,
		labelText: "球机1",
		image: {
			url: "./image/qj.svg"
		}
	}
];
globalMap.addMarkers(data);
```

[返回目录](#目录)

9. ### hideMarkerByIds

```js
var data = [
	{
		id: "camera01", //图标点唯一id
		lon: 108.963966,
		lat: 34.2656,
		height: 10,
		labelText: "摄像机1", //图标显示的label
		image: {
            url: "./image/camera.jpg" //图标地址 支持svg/png/jpg
            width: 30, //图标宽度
            height: 40 //图标高度
		}
	},
	{
		id: "camera02",
		lon: 108.9637666,
		lat: 34.2654362,
		height: 10,
		labelText: "球机1",
		image: {
			url: "./image/qj.svg"
		}
	}
];
let ids = data.map(item => item.id);
globalMap.hideMarkerByIds(ids);
```

备注: 该方法不会直接销毁 Marker,只会隐藏,再次调用时 Marker 显示

[返回目录](#目录)

9. ### removeMarkerByIds

```js
let ids = data.map((item) => item.id);
globalMap.removeMarkerByIds(ids);
```

备注: 该方法会直接销毁 Marker

[返回目录](#目录)

10. ### removeAllMarkers

```js
globalMap.removeAllMarkers();
```

备注: 该方法会直接销毁所有 Marker

[返回目录](#目录)

11. ### removeMarker

```js
let markers = global.addMarkers([{
		id: "camera01", //图标点唯一id
		lon: 108.963966,
		lat: 34.2656,
		height: 10,
		labelText: "摄像机1", //图标显示的label
		image: {
            url: "./image/camera.jpg" //图标地址 支持svg/png/jpg
            width: 30, //图标宽度
            height: 40 //图标高度
		}
    }])
let marker = markers[0];
globalMap.removeMarker(marker);
```

备注: 该方法会销毁指定的 Marker

[返回目录](#目录)

12. ### setColor

```js
let markerIds = data.map((marker) => marker.id);
global.setColor(markerIds, "red");
```

备注: 该方法批量设置 Marker 的颜色, 颜色值支持 `rgb(255,255,143)`, `#EEEEEE`, `'red'`。

[返回目录](#目录)

13. ### resetColor

```js
let markerIds = data.map((marker) => marker.id);
global.resetColor(markerIds);
```

备注: 该方法批量重置 Marker 的颜色, 重置为 Cesium 的默认色。

[返回目录](#目录)

14. ### containsMarker

```js
let markers = global.addMarkers([{
		id: "camera01", //图标点唯一id
		lon: 108.963966,
		lat: 34.2656,
		height: 10,
		labelText: "摄像机1", //图标显示的label
		image: {
            url: "./image/camera.jpg" //图标地址 支持svg/png/jpg
            width: 30, //图标宽度
            height: 40 //图标高度
		}
    }])
let marker = markers[0];
global.containsMarker(marker);
```

备注: 该方法判断地图中是否包含指定 marker,返回值: `true`:包含, `false`: 不包含。

[返回目录](#目录)

15. ### registerEvent

```js
// 注册点击事件
globalMap.registerEvent("click", (entry, position) => {
	// 点击事件执行的回调
	// entry 被点击的实体
	// position 点击的位置
});
```

> 注:该版本只封装了部分鼠标事件，枚举如下

```
事件类型枚举
{
    click: "鼠标左键单击",
    dbclick: "鼠标左键双击",
    mousedown: "鼠标左键按下",
    mouseup: "鼠标左键抬起",
    mousemove: "鼠标移动",
    mousewheel: "鼠标滚轮"
}
```

[返回目录](#目录)

16. ### unRegisterEvent

```js
// 注销地图鼠标点击事件
// 参数: 事件类型
globalMap.unRegisterEvent("click");
```

17. ### addInfowindow

```js
globalMap.addInfowindow(entry, position, {
	className: "info-window",
	html: "<div>111</div>"
});
```

备注: <br />

1. 该方法添加的信息框可随地图的拖动而移动,如果不需要移动可自行在项目功能中封装<br />
2. 该方法内部实现只能同时出现一个信息框<br />

> 参数说明:

```
entry: 实体类 Marker,跟随Marker移动
position: 坐标位置
cofig: {
    classNam: 信息框类名
    html: 信息框渲染的html模板
    offsetX: 信息框X轴偏移像素值 Number
    offsetY: 信息框Y轴偏移像素值 Number
}
```

[返回目录](#目录)

18. ### removeInfoWindow

```js
globalMap.removeInfoWindow();
```

19. ### disableCameraToGround

```js
globalMap.disableCameraToGround();
```

备注: 该方法用于在旋转模型时,防止相机视角穿地,已在初始化时默认开启。

20. ### startDraw

```js
globalMap.startDraw(mode);
```

备注: 该方法用于绘制几何体(线、多边形、圆、矩形)

> 绘制模式 mode 枚举

```
line        线
polygon     多边形
circle      圆
rectangle   矩形
```

22. ### getFlatternDistance

```js
globalMap.getFlatternDistance(lat1, lng1, lat2, lng2);
```

备注: 该方法用于计算两点间距离

23. ### destory

```js
globalMap.destory();
```

[返回目录](#目录)

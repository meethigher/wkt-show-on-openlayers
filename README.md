平时经常跟经纬度打交道，绘制经纬度目前常用的三个结构：geojson、wkt、wkb。这篇文章简单记录下，实现wkt绘制展示的过程。

老规矩，先放抄袭来源。

1. [OpenLayers - Welcome](https://openlayers.org/)
2. [clydedacruz/openstreetmap-wkt-playground: Plot and visualize WKT shapes on OpenStreetMap](https://github.com/clydedacruz/openstreetmap-wkt-playground)
3. [根据背景颜色的亮度调整字体的颜色 - SegmentFault 思否](https://segmentfault.com/a/1190000016905348)
4. [html中rem的理解&简单运用示例_Zhi.C.Yue的博客-CSDN博客_html rem](https://blog.csdn.net/Jacoh/article/details/84262507)

# 一、效果图

放最后[成果图](https://meethigher.top/wkt/)，以及[源码](https://github.com/meethigher/wkt-show-on-openlayers)。

小屏效果

![](https://meethigher.top/blog/2022/wkt-show-on-openlayers/1.jpg)

大屏效果

![](https://meethigher.top/blog/2022/wkt-show-on-openlayers/2.jpg)

# 二、具体源码

先说要点，由于openStreetMap是个平面，以米为单位，平面就是投影坐标系了。openstreetmap是基于3857投影坐标系的。

![](https://meethigher.top/blog/2022/wkt-show-on-openlayers/3.jpg)

而我们用的经纬度，是以度为单位的，这种的叫做球面坐标系。目前主流的球面坐标系就是4326。

常见wkt都是以经纬度来存储，也就是球面坐标系。openstreetmap是基于3857投影坐标系的。

为了方便在openstreetmap上图，我们需要转换坐标系。

将地图点转为wkt时，要把3857转为4326。

在wkt转换为地图点时，要把4326转为3857。

> 这边一开始想着可以自定义是否要转换4326，还是其他，想了一下，好像没啥必要。就目前我实际使用中，都是4326和3857。

index.css

```css
*,
*::before,
*::after {
    /*所有的标签和伪元素都选中*/
    margin: 0;
    padding: 0;
    /*移动端常用布局是非固定像素布局*/
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    /*点击高亮效果清除*/
    tap-highlight-color: transparent;
    -webkit-tap-highlight-color: transparent;
}

ul, ol {
    list-style: none;
}

a {
    text-decoration: none;
}

input {
    border: none;
    outline: none;
    /*不允许改变尺寸*/
    resize: none;
    /*元素的外观 none没有任何样式*/
    -webkit-appearance: none;
}

header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #13172f;
    height: 55px;
    overflow: hidden;
    z-index: 10;
}

nav {
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    height: 55px;
}

nav span, nav a {
    display: inline-block;
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: 25px;
}

nav span {
    color: #ffffff;
}

nav a {
    color: #9d9d9d;
}

nav a:hover {
    color: #fff;
}


nav button {
    padding-right: 10px;
    padding-left: 10px;
    height: 50px;
    border-radius: 4px;
    border-color: #333;
    background-color: transparent;
    font-size: 25px;
    color: #9d9d9d;
    display: none;
    margin-top: 2px
}


nav ul {
    float: right;
    height: 55px;
}

nav ul li {
    padding-left: 10px;
    padding-right: 10px;
    float: left;
}

@media screen and (min-width: 960px) {
    header {
    }

    nav {
        width: 960px;
    }
}

@media screen and (max-width: 960px) {
    nav {
        width: 100%;
        text-align: center;
    }

    nav ul {
        display: none;
    }
}


#container {
    width: 100%;
    position: absolute;
    bottom: 0;
    top: 55px;
    overflow: hidden;
}

.map {
    height: 100%;
}


#tool {
    position: absolute;
    z-index: 1;
    top: 10px;
    left: 3rem;
    background-color: transparent;
}

#tool button {
    background-color: #13172f;
    color: #9d9d9d;
    border: none;
    font-size: 1rem;
    border-radius: 4px;
    padding: 5px 10px 5px 10px;
}

#tool button:hover {
    color: #fff;
}

#tool button.active {
    border: 4px solid rgba(255, 255, 255, .2);
    color: #fff;
}

#content {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: 100%;
    padding: 1rem 1rem 0 1rem;
}

#content textarea {
    resize: none;
    width: 100%;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    font-size: 1rem;
    margin-top: 1rem;
    font-weight: bolder;
    padding: .5rem;
    line-height: 1.5rem;
}

#content textarea:focus {
    color: #495057;
    background-color: #fff;
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);

}

#content button {
    background-color: #13172f;
    color: #9d9d9d;
    border-radius: 4px;
    padding: 5px 10px 5px 10px;
    font-size: 1rem;
    border: 4px solid transparent;
}

#content button:hover {
    color: #ffffff;
}

#content button:focus {
    color: #fff;
    border-color: rgba(255, 255, 255, .2);
}
```

index.js

```js
let requestUrl = window.location.href.replace(/http:\/\/|https:\/\//, "");
let raster;
let source;
let vector;
let map;
let draw;
let features = new ol.Collection();
let format = new ol.format.WKT();
let current_shape = "Point";

let fill = new ol.style.Fill({
    color: 'rgba(210, 122, 167,0.2)'
});

let stroke = new ol.style.Stroke({
    color: '#B40404',
    width: 2
});

let styles = [
    new ol.style.Style({
        image: new ol.style.Circle({
            fill: fill,
            stroke: stroke,
            radius: 5
        }),
        fill: fill,
        stroke: stroke
    })
];

function colorReverse(color) {
    color = '0x' + color.replace(/#/g, '');
    let str = '000000' + (0xFFFFFF - color).toString(16);
    return '#' + str.substring(str.length - 6, str.length);
}

function hexToRgb(hexColor) {
    return parseInt(hexColor, 16).toString();
}

/**
 * 获取颜色亮度
 * @param color #ffffff
 * @returns {number}
 */
function colorBrightness(color) {
    let useColorValue = color.slice(1);
    let rColor = useColorValue.slice(0, 2);
    let gColor = useColorValue.slice(2, 4);
    let bColor = useColorValue.slice(4);

    let rColorValue = hexToRgb(rColor);
    let gColorValue = hexToRgb(gColor);
    let bColorValue = hexToRgb(bColor);
    return rColorValue * 0.299 + gColorValue * 0.587 + bColorValue * 0.114;
}

function isWhiteColor(color) {
    if (colorBrightness(color) < 128) {
        return "#ffffff";
    } else {
        return "#000000";
    }
}

function randomColor() {
    let randomColor = `#${Math.random().toString(16).substr(2, 6)}`;
    //更新 LineString or Polygon 的边颜色
    stroke.setColor(randomColor);
    //更新 Point 的边颜色
    let image = new ol.style.Circle({
        fill: fill,
        stroke: stroke,
        radius: 5
    });
    styles[0].setImage(image);
    //更新按钮颜色
    document.getElementById("colorShow").style.backgroundColor = randomColor;
    document.getElementById("colorShow").innerText = randomColor;
    document.getElementById("colorShow").style.color = isWhiteColor(randomColor);
}

function addInteraction(shape) {
    draw = new ol.interaction.Draw({
        features: features,
        type: shape
    });
    map.addInteraction(draw);
}

/**
 * 创建向量
 */
function createVector() {
    vector = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
        style: styles
    });
}

/**
 * 转换3857坐标系为4326
 * @param element
 * @param index
 * @param array
 */
function toEPSG4326(element, index, array) {
    element = element.getGeometry().transform('EPSG:3857', 'EPSG:4326');
}

/**
 * 转换4326坐标系到3857
 * @param element
 * @param index
 * @param array
 */
function toEPSG3857(element, index, array) {
    element = element.getGeometry().transform('EPSG:4326', 'EPSG:3857');
}

/**
 * 选择geometry类型
 * @param shape
 */
function selectGeom(shape) {
    current_shape = shape;
    map.removeInteraction(draw);
    addInteraction(shape);
}


/**
 * 存储默认颜色
 */
function restoreDefaultColors() {
    document.getElementById("stringArea").style.borderColor = "";
    document.getElementById("stringArea").style.backgroundColor = "";
}

/**
 * 渲染wkt
 */
function plotWKT(flag) {
    let new_feature;

    wkt_string = document.getElementById("stringArea").value;
    if (wkt_string == "") {
        document.getElementById("stringArea").style.borderColor = "red";
        document.getElementById("stringArea").style.backgroundColor = "#F7E8F3";
        return;
    } else {
        try {
            new_feature = format.readFeature(wkt_string);
        } catch (err) {
        }
    }

    if (!new_feature) {
        document.getElementById("stringArea").style.borderColor = "red";
        document.getElementById("stringArea").style.backgroundColor = "#F7E8F3";
        return;
    } else {
        if (flag) {
            map.removeLayer(vector);
            features.clear();
        }
        new_feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
        features.push(new_feature);
    }
    vector = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
        style: styles
    });
    selectGeom(current_shape);
    map.addLayer(vector);
    derived_feature = features.getArray()[0];
    extent = derived_feature.getGeometry().getExtent();
    minx = derived_feature.getGeometry().getExtent()[0];
    miny = derived_feature.getGeometry().getExtent()[1];
    maxx = derived_feature.getGeometry().getExtent()[2];
    maxy = derived_feature.getGeometry().getExtent()[3];
    centerx = (minx + maxx) /2;
    centery = (miny + maxy) /2;
    map.setView(new ol.View({
        center: [centerx, centery],
        zoom: 8
    }));
    map.getView().fit(extent, map.getSize());
}
/**
 * 清空
 */
function clearMap() {
    map.removeLayer(vector);
    features.clear();
    vector = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
        style: styles
    });
    selectGeom(current_shape);
    map.addLayer(vector);
    document.getElementById("stringArea").value = "GEOMETRYCOLLECTION()";
    restoreDefaultColors();
}
/**
 * 通过url加载wkt
 * 比如传参形式url#wkt
 * @param fragment
 */
function loadWKTfromURIFragment(fragment) {
    //移除掉#
    let wkt = window.location.hash.slice(1);
    document.getElementById("stringArea").value = decodeURI(wkt);
}
/**
 * 统计
 * @param url
 * @param requestUrl
 */
function sendPost(url, requestUrl) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("origin-referer", document.referrer);
    xhr.send(requestUrl)
}
function printDefaultLog() {
    console.log("%c@author：Kit Chen\n@createDate：2022-05-16\n@页面加载耗时：" + (performance.now() /1000).toFixed(2) + "秒", "font-size:18px; font-weight:bold; color:#24a0f0;")
}
sendPost("https://meethigher.top:9090/count", requestUrl);
window.onload = function () {
    createVector();
    raster = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    features.on("add", function (e) {
        restoreDefaultColors();
        features.forEach(toEPSG4326);
        document.getElementById('stringArea').value = format.writeFeatures(features.getArray(), {rightHanded: true});
        features.forEach(toEPSG3857);
    });

    map = new ol.Map({
        layers: [raster, vector],
        target: 'meethigher',
        view: new ol.View({
            center: [-11000000, 4600000],
            zoom: 4
        })
    });
    if (window.location && window.location.hash) {
        loadWKTfromURIFragment(window.location.hash);
    }
    plotWKT();
    selectGeom(current_shape);
};
printDefaultLog();

$("#tool button").on("click", function () {
    $("button.active").removeClass("active");
    $(this).addClass("active");
});
```

index.html

```html
<!doctype html>
<html lang="zh">
<head>
    <meta charset="utf-8">
    <meta name="keywords" content="wkt,point,linestring,polygon,geometry,openstreetmap,earth"/>
    <meta name="description" content="well-known-text在线绘制展示"/>
    <meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1,maximum-scale=1,minimum-scale=1">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet"
          href="https://meethigher.top/wkt/ol.css"
          type="text/css">
    <link rel="stylesheet" href="https://meethigher.top/wkt/index.css">
    <title>well-known-text在线绘制展示</title>
</head>
<body>
<header>
    <nav>
        <span>wkt在线绘制展示</span>
        <ul class="ull">
            <li><a href="https://meethigher.top">主页</a></li>
            <li><a href="">geojson在线绘制展示</a></li>
        </ul>
    </nav>
</header>
<div id="container">
    <div id="meethigher" class="map"></div>
    <div id="tool">
        <button type="button" class="active" onclick="selectGeom('Point')">Point</button>
        <button type="button" class="" onclick="selectGeom('LineString')">LineString</button>
        <button type="button" class="" onclick="selectGeom('Polygon')">Polygon</button>
    </div>
</div>
<div id="content">
    <button type="button" onclick="clearMap()">清空</button>
    <button type="button" onclick="plotWKT(true)">全量渲染</button>
    <button type="button" onclick="plotWKT(false)">追加渲染</button>
    <button id="colorShow" type="button" onclick="randomColor()" style="background-color: #B40404;">#B40404</button>
    <textarea id="stringArea" cols="30" rows="5">POLYGON((113.36572265625 38.80204526520603,107.28369301557538 33.994384090476174,112.38134926557541 28.960087983961387,119.2368153333664 31.690781121452815,113.36572265625 38.80204526520603))</textarea>
</div>
<script src="https://meethigher.top/blog/js/module/jquery.min.js"></script>
<script src="https://meethigher.top/wkt/ol.js"></script>
<script src="https://meethigher.top/wkt/index.js"></script>
</body>
</html>
```


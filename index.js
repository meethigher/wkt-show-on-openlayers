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
    color: '#4e9f13',
    width: 2
});

let newStyle = new ol.style.Style({
    image: new ol.style.Circle({
        fill: fill,
        stroke: stroke,
        radius: 5
    }),
    fill: fill,
    stroke: stroke
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
    //更新边颜色
    newStyle = new ol.style.Style({
        image: new ol.style.Circle({
            fill: fill,
            stroke: new ol.style.Stroke({
                color: randomColor,
                width: 2
            }),
            radius: 5
        }),
        fill: fill,
        stroke: new ol.style.Stroke({
            color: randomColor,
            width: 2
        })
    });
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

    createVector();
    selectGeom(current_shape);
    map.addLayer(vector);
    //控制视角
    derived_feature = features.getArray()[0];
    extent = derived_feature.getGeometry().getExtent();
    minx = derived_feature.getGeometry().getExtent()[0];
    miny = derived_feature.getGeometry().getExtent()[1];
    maxx = derived_feature.getGeometry().getExtent()[2];
    maxy = derived_feature.getGeometry().getExtent()[3];
    centerx = (minx + maxx) / 2;
    centery = (miny + maxy) / 2;
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
    // 移除掉#
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
    xhr.send(requestUrl);
}

function printDefaultLog() {
    console.log("%c@author：Kit Chen\n@createDate：2022-05-16\n@blog：https://meethigher.top/blog/2022/wkt-show-on-openlayers/\n@github：https://github.com/meethigher/wkt-show-on-openlayers\n@页面加载耗时：" + (performance.now() / 1000).toFixed(2) + "秒", "font-size:18px; font-weight:bold; color:#24a0f0;")
}

sendPost("https://meethigher.top/census/count", requestUrl);
window.onload = function () {
    createVector();
    raster = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    features.on("add", function (e) {
        features.R[features.getLength() - 1].setStyle(newStyle);
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

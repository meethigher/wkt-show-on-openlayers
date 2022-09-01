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


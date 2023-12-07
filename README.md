# 主要介绍下 MediaPipe ：

**导入目录下的工具类 `imageClipper`,在特定位置使用这个异步方法：**

`clipper.clip(src)`

```js
const clipper = await ImageClipper.Create();
  const img = await clipper.clip(
    "https://cdn.zhenghexingyi.com/smile/0097ce56-fc49-4ed7-9010-54d6c945708f.jpg"
  );
console.log(img) //返回base64格式数据
```

**裁剪以嘴巴为中心，生成一张2:1的图片，具体大小根据脸部宽度决定**

因为项目中使用了**openCV.js**，所以需要单独配置一下web端的配置，涉及到nose.js的方法舍去掉：

```js
//vue.config.js  如果是react或者其他项目可添加 webpack.config.js 重写  把下面三个禁掉就不会报错

module.exports = defineConfig({
 //...
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
  },
});
```

需要下载的npm包有：

```js
//用于监测脸部点位确定嘴巴位置
npm i @mediapipe/tasks-vision": "0.10.3"
//用于监测脸部点位确定嘴巴位置
npm i @tensorflow/tfjs-core": "^4.14.0"
//用于对图像进行美化操作，目前只做了双边滤波的操作
npm i @techstark/opencv-js": "^4.8.0-release.10"

```

具体参数，详见 `imageClipper`类，可根据需求自行修改调整滤镜或者裁剪图片等参数
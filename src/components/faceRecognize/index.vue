<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <input
      hidden
      type="file"
      @change="setImage"
      accept="image/*"
      ref="pickImage"
    />

    <!--  图片/视频 捕获区  -->
    <div class="detectBox">
      <img
        v-show="!data.trackVideoFaces && !data.trackCameraFaces"
        :src="data.base64"
        alt=""
        width="500"
        ref="img"
        id="myImg"
        @load="detectFactory"
      />

      <video
        v-if="data.trackVideoFaces"
        width="500"
        ref="video"
        id="myVideo"
        muted
        playsinline
        preload
        loop
        @durationchange="video.play()"
        @play="data.videoStatus = 1"
        @pause="data.videoStatus = 0"
      >
        <source src="./media/shylock.mp4" type="video/mp4" />
        抱歉，您的浏览器不支持嵌入式视频。
      </video>

      <video
        v-if="data.trackCameraFaces"
        ref="video"
        id="myVideo"
        autoplay
        muted
        playsinline
        @play="data.videoStatus = 1"
        @pause="data.videoStatus = 0"
      />

      <canvas ref="canvas" />
    </div>

    <van-checkbox-group v-model="data.detectList" @change="detectFactory">
      <van-checkbox name="AgeAndGender">年龄性别</van-checkbox>
    </van-checkbox-group>
    <van-button plain type="primary" @click="pickImage.click()">
      选择图片
    </van-button>
  </div>
</template>

<script setup>
import * as faceapi from "face-api.js";
import { onMounted, reactive, toRefs } from "vue";

import { Toast } from "vant";

const data = reactive({
  base64: "",
  detectList: ["AgeAndGender"], // 检测项
  genderTranslator: {
    male: "男",
    female: "女",
  },
  // 检测类型
  detectTypes: [
    "AgeAndGender", //  年龄性别
  ],
  columns: [
    {
      values: [
        { text: "SSD", value: "SSD" },
        { text: "Tiny", value: "Tiny" },
      ],
      defaultIndex: 1,
    },
    {
      values: [
        { text: "0.1", value: 0.1 },
        { text: "0.2", value: 0.2 },
        { text: "0.3", value: 0.3 },
        { text: "0.4", value: 0.4 },
        { text: "0.5", value: 0.5 },
        { text: "0.6", value: 0.6 },
        { text: "0.7", value: 0.7 },
        { text: "0.8", value: 0.8 },
        { text: "0.9", value: 0.9 },
      ],
      defaultIndex: 4,
    },
    {
      values: [
        { text: "128", value: 128 },
        { text: "160", value: 160 },
        { text: "224", value: 224 },
        { text: "320", value: 320 },
        { text: "416", value: 416 },
        { text: "512", value: 512 },
        { text: "608", value: 608 },
      ],
      defaultIndex: 3,
    },
  ],
  selectedValue: ["Tiny", 0.5, 320],

  showCameraList: false, // 摄像头列表弹出层
  cameraList: [],

  count: 0,
  forwardTimes: [],
  time: "",
  fps: "",
});
const refs = reactive({
  canvas: null,
  img: null,
  pickImage: null,
});
const { canvas, img, video, pickImage } = toRefs(refs);

/**
 * remind
 *
 * const input = await faceapi.fetchImage(uri);
 * */

// 设置页面图片
const setImage = async (e) => {
  const files = e.target.files;
  console.log(files[0], "files");
  // 从Blob中创建一个HTMLImageElement
  const img = await faceapi.bufferToImage(files[0]);
  data.base64 = img.src;
};

/**
 * @desc 自定义文本字段
 *
 * @param {array}  texts   - 多行文字
 * @param {object} pos     - 文本位置
 * @param {object} options - 配置项
 * */
const drawTexts = (texts, pos, options) => {
  // 绘制多行文本块
  const text = ["This is a textline!", "This is another textline!"];
  const anchor = { x: 200, y: 200 }; // 相对于canvas的位置
  const drawOptions = {
    backgroundColor: "pink", // 文字块的背景颜色
    // fontColor: 'purple',                   // 文字颜色
    fontSize: 24, // 文字大小
    // padding: 15                            // 文字的padding
  };

  const drawTextBox = new faceapi.draw.DrawTextField(
    texts || text,
    pos || anchor,
    options || drawOptions
  );
  drawTextBox.draw(canvas.value);
};

const detectFactory = async () => {
  const { base64 } = data;
  console.log(base64, "base64");
  const input = "myImg";

  if (input === "myImg" && !base64) {
    return;
  }

  let displaySize;

  if (input === "myImg") {
    displaySize = {
      width: img.value.width,
      height: img.value.height,
    };
  } else {
    displaySize = faceapi.matchDimensions(canvas.value, video.value, true);
  }
  // 准备画布，没有这一步方框位置会偏移
  faceapi.matchDimensions(canvas.value, displaySize);

  const options = getFaceDetectorOptions();

  // 绘制性别年龄
  const detections = await faceapi
    .detectAllFaces(input, options)
    .withFaceLandmarks()
    .withAgeAndGender();

  console.log(detections);

  // 调整检测到的盒子和地标的大小，以防显示的图像与原始图像大小不同
  const resizedResults = faceapi.resizeResults(detections, displaySize);

  console.log(resizedResults);

  // 输出年龄、性别、年龄可能性
  resizedResults.forEach((result) => {
    const { age, gender, genderProbability } = result;

    drawTexts(
      [
        `${data.genderTranslator[gender]} (${
          faceapi.utils.round(genderProbability) * 100
        }%)`,
        `${faceapi.utils.round(age, 0)} 岁 `,
      ],
      result.detection.box.bottomLeft
    );
  });
};

// 配置人脸检测器参数
const getFaceDetectorOptions = () => {
  const { selectedValue } = data;

  /**
         * @param inputSize?: number
         处理图像的大小，越小越快
         在检测较小的人脸时， 必须被32整除
         常见的大小有128、160、224、320、416、512、608 ,
         用于通过网络摄像头进行人脸跟踪我建议使用较小尺寸的，例如128、160
         用于检测较小的人脸使用较大尺寸的，例如512、608
         默认值： 416
         *  @param scoreThreshold?: number
         最小置信阈值
         默认值:0.5
         *
         * @desc inputSize和scoreThreshold的不同配置，都会影响返回结果的数量
         * */
  return new faceapi.TinyFaceDetectorOptions({
    scoreThreshold: selectedValue[1],
    inputSize: selectedValue[2],
  });
};

// 加载模型
const init = () => {
  const toast = Toast.loading({
    duration: 0,
    message: "模型加载中...",
    forbidClick: true,
    mask: true,
  });

  // 加载训练好的模型np
  // ageGenderNet:          年龄、性别识别模型，大约420KB
  // faceExpressionNet:     人脸表情识别模型，识别表情,开心，沮丧，普通，大约310KB
  // faceLandmark68Net：    68个点人脸地标检测模型（默认模型），大约350KB
  // faceLandmark68TinyNet：68个点人脸地标检测模型（小模型），大约80KB
  // faceRecognitionNet:    人脸识别模型，可以比较任意两个人脸的相似性，大约6.2MB
  // ssdMobilenetv1：       SSD 移动网络 V1，大约5.4MB，准确的最高，推理时间最慢
  // tinyFaceDetector:      微型人脸检测器（实时人脸检测器），与 SSD Mobilenet V1 人脸检测器相比，它速度更快、体积更小且资源消耗更少，但在检测小人脸方面的表现略逊一筹。移动和网络友好
  // mtcnn                  大约2MB
  // tinyYolov2             识别身体轮廓的算法，不知道怎么用
  Promise.all([
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.ageGenderNet.loadFromUri("./models"),
  ])
    .then(() => {
      toast.clear();
    })
    .catch(() => {
      toast.clear();
    });
};

onMounted(() => {
  init();
});
</script>

<style lang="less" scoped>
/* 图片/视频 捕获区 */
.detectBox {
  position: relative;
  min-height: 200px;

  img {
    width: 100%;
  }

  canvas {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
}

/* 美化样式 */
.van-button {
  margin: 20px 15px 0 0;
}

.van-checkbox-group {
  background: #fff;
  padding: 15px;
  margin-top: 10px;

  .van-checkbox {
    margin-bottom: 10px;
  }
}

.bottomBox {
  p {
    display: flex;
    align-items: center;
    margin-top: 10px;
    font-size: 14px;
    background-color: #fff;
    padding: 5px;
    color: #666;
    font-style: italic;

    .van-switch {
      margin-right: 10px;
    }
  }
}

.timer {
  font-size: 14px;
  line-height: 20px;
  background-color: #fff;
  padding: 5px;
  margin: 10px 0;
  box-sizing: border-box;
}
</style>

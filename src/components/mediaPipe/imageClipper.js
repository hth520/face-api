import "@tensorflow/tfjs-core/dist/tf-core.js";
import vision from "@mediapipe/tasks-vision";
const { FaceLandmarker, FilesetResolver } = vision;
// import cv from "./opencv.js";
import cv from "@techstark/opencv-js";
export default class ImageClipper {
  constructor() {}
  static async Create() {
    const clipImage = new ImageClipper();
    await clipImage.createFaceLandmarker();
    return clipImage;
  }
  async clip(src) {
    return await this.initClipImg(src);
  }
  async initClipImg(img) {
    return new Promise(resolve => {
      const image = new Image();
      image.src = img;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        canvas.setAttribute("width", `${image.width}px`);
        canvas.setAttribute("height", `${image.height}px`);
        canvas.style.width = `${image.width}px`;
        canvas.style.height = `${image.height}px`;
        const faceLandmarkerResult = this.faceLandmarker.detect(image);
        const lipAreaCenter = this.lipArea(
          faceLandmarkerResult.faceLandmarks[0],
          image
        );

        // 截取图片长度为脸颊点 215  435
        const lipAreaWidth =
          this.fromNdcToImage(faceLandmarkerResult.faceLandmarks[0][435], image)
            .x -
          this.fromNdcToImage(faceLandmarkerResult.faceLandmarks[0][215], image)
            .x;
        const lipAreaHeight = lipAreaWidth / 2;

        const lipAreaX = lipAreaCenter.x - lipAreaWidth / 2;
        const lipAreaY = lipAreaCenter.y - lipAreaHeight / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          image,
          lipAreaX,
          lipAreaY,
          lipAreaWidth,
          lipAreaHeight,
          0,
          0,
          lipAreaWidth,
          lipAreaHeight
        );
        const clipCanvas = document.createElement("canvas");
        clipCanvas.width = lipAreaWidth;
        clipCanvas.height = lipAreaHeight;

        const data = ctx.getImageData(0, 0, lipAreaWidth, lipAreaHeight);

        const context = clipCanvas.getContext("2d");
        context.putImageData(data, 0, 0);

        let mat = cv.imread(clipCanvas);
        mat = this.bilateralFilter(mat, 3, 2);
        cv.imshow(clipCanvas, mat);

        mat.delete();
        return resolve(clipCanvas.toDataURL("image/png", 1));
      };
    });
  }
  async createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    this.faceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1,
      }
    );
  }
  fromNdcToImage(point, img) {
    return {
      x: point.x * img.width,
      y: point.y * img.height,
    };
  }
  // lip area
  lipArea(point, img) {
    let outer_lips = point.filter((s, i) =>
      [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267,
        0, 37, 39, 40, 185,
      ].includes(i)
    );
    let maxX = outer_lips[0].x;
    let maxY = outer_lips[0].y;
    let minX = outer_lips[0].x;
    let minY = outer_lips[0].y;
    outer_lips.map(s => {
      maxX = maxX > s.x ? maxX : s.x;
      maxY = maxY > s.y ? maxY : s.y;
      minX = minX < s.x ? minX : s.x;
      minY = minY < s.y ? minY : s.y;
    });
    let top_left = this.fromNdcToImage({ x: minX, y: minY }, img),
      top_right = this.fromNdcToImage({ x: maxX, y: minY }, img),
      bottom_right = this.fromNdcToImage({ x: maxX, y: maxY }, img),
      bottom_left = this.fromNdcToImage({ x: minX, y: maxY }, img);

    let ex = (top_left.x + bottom_right.x) / 2;
    let ey = (top_left.y + bottom_right.y) / 2;

    let fx = (top_right.x + bottom_left.x) / 2;
    let fy = (top_right.y + bottom_left.y) / 2;

    return {
      x: (ex + fx) / 2,
      y: (ey + fy) / 2,
    };
  }
  intraoralPoint(point) {
    let inner_lips = point.filter((s, i) =>
      [
        78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317,
        14, 87, 178, 88, 95,
      ].includes(i)
    );
    return [...inner_lips, inner_lips[0]];
  }
  bilateralFilter(image, value1, value2) {
    let dst = new cv.Mat();
    if (value1 == null || value1 == undefined) value1 = 3; //磨皮系数
    if (value2 == null || value2 == undefined) value2 = 1; //细节系数 0.5 - 2

    var dx = value1 * 5; //双边滤波参数
    var fc = value1 * 12.5; //参数
    var p = 0.1; //透明度

    let temp2 = new cv.Mat(),
      temp3 = new cv.Mat(),
      temp4 = new cv.Mat();

    cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);

    let filteredImage = new cv.Mat();
    cv.bilateralFilter(image, filteredImage, dx, fc, fc);

    let temp22 = new cv.Mat();
    cv.subtract(filteredImage, image, temp22);

    cv.add(
      temp22,
      new cv.Mat(
        image.rows,
        image.cols,
        image.type(),
        new cv.Scalar(128, 128, 128, 128)
      ),
      temp2
    );

    cv.GaussianBlur(
      temp2,
      temp3,
      new cv.Size(2 * value2 - 1, 2 * value2 - 1),
      0,
      0
    );

    let temp44 = new cv.Mat();
    temp3.convertTo(temp44, temp3.type(), 2, -255);

    cv.add(image, temp44, temp4);
    cv.addWeighted(image, p, temp4, 1 - p, 0.0, dst);

    cv.add(
      dst,
      new cv.Mat(
        image.rows,
        image.cols,
        image.type(),
        new cv.Scalar(10, 10, 10, 0)
      ),
      dst
    );
    return dst;
  }
}

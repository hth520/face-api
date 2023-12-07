<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <button v-on:click="click">切换</button>
    <div class="face">
      <img
        class="oldImg"
        :style="{ zIndex: data.oldZ }"
        v-bind:src="data.oldImg"
        alt=""
      />
      <img
        class="newImg"
        :style="{ zIndex: data.newZ }"
        v-bind:src="data.newImg"
        alt=""
      />
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive } from "vue";
import ImageClipper from "./imageClipper.js";
const data = reactive({
  oldImg: "",
  newImg: "",
  oldZ: 0,
  newZ: 1,
});
onMounted(async () => {
  const clipper = await ImageClipper.Create();
  data.oldImg = await clipper.clip(
    "https://cdn.zhenghexingyi.com/smile/0097ce56-fc49-4ed7-9010-54d6c945708f.jpg"
  );
  data.newImg = await clipper.clip(
    "https://cdn.zhenghexingyi.com/smile_repaint/202312011437100a4d13b3-f5b5-4a4c-8293-3794cec66cd9.jpg"
  );
});
const click = () => {
  data.oldZ = data.oldZ == 0 ? 1 : 0;
  data.newZ = data.newZ == 1 ? 0 : 1;
};
</script>
<style lang="less" scoped>
.face {
  position: relative;
  width: 800px;
  height: 500px;
  background-color: pink;
}
.face img {
  width: 600px;
  height: 300px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.face .oldImg {
  z-index: 1;
}
</style>

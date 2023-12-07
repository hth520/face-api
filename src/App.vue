<template>
  <div id="app">
    <!-- <FaceRecognize /> -->
    <MediaPipe />
  </div>
</template>

<script>
// import FaceRecognize from "@/components/faceRecognize/index.vue";
import MediaPipe from "@/components/mediaPipe/index.vue";

export default {
  name: "App",
  components: {
    // FaceRecognize,
    MediaPipe,
  },
};
</script>

<style>
body {
  background: #efeff4;
  text-align: left;
  padding: 0 10px;
  height: 100vh;
  overflow: auto;
}
</style>

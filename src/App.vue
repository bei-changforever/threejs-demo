<script setup lang="ts">
import { RouterView } from 'vue-router';
import autofit from 'autofit.js';
import { onMounted } from 'vue';
onMounted(() => {
  autofit.init({
    dh: 1080,
    dw: 1920,
    el: "#app-container",
    resize: true
  })
})
</script>

<template>
  <div id="app-container">
    <div class="left">

    </div>
    <RouterView />
    <div class="right">

    </div>

  </div>
</template>

<style lang="scss" scoped>
#app-container {
  // background-color: pink;
  position: relative;
  // width: 100vw;
  // height: 100vh;
  margin: 0;
  padding: 0;

  .left {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 465px;
    height: calc(100% - 50px);
    top: 50px;
    left: 20px;
    background: linear-gradient(90deg, rgba(9, 23, 51, 0.8) 0%, rgba(13, 42, 67, 0.24) 100%);
    z-index: 9;

  }

  .right {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 465px;
    height: calc(100% - 50px);
    top: 50px;
    right: 20px;
    background: linear-gradient(90deg, rgba(9, 23, 51, 0.8) 0%, rgba(13, 42, 67, 0.24) 100%);
    z-index: 9;
  }
}
</style>

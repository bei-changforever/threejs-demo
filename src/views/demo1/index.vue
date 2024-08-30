<template>
    <div id="demo1" ref="demo1">

    </div>
</template>

<script setup lang="ts">
import ThreeJS from './index';
import { onMounted, ref } from 'vue'
const demo1 = ref(null) as any




onMounted(() => {
    new ThreeJS(demo1.value);
})
</script>

<style lang="scss"  scoped>
#demo1 {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>
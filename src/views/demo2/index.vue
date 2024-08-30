<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, h, toRefs, nextTick, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'





const progress = ref(0)
const showProgress = ref(true)
let group: any // 3d模型
let warnLabelList: any = {}

const emit = defineEmits(['changeIndoor'])

onMounted(() => {
  init()
  render()

})

const deviceOptions = reactive<any>({

  warningOptions: []
})






// 给点位数据添加后端数据
const setMarkOptionsData = (data: any, deviceType: string) => {
  deviceOptions[deviceType].forEach((dItem: any) => {
    data.forEach((item: any) => {
      if (dItem.children?.length) {
        dItem.children.forEach((child: any) => {
          if (item.equipmentName === child.name && item.equipmentLocation === child.location) {
            Object.assign(child, item)
            child.equipmentId = item.id
          }
        })
      } else if (item.equipmentName === dItem.name && item.equipmentLocation === dItem.location) {
        Object.assign(dItem, item)
        dItem.equipmentId = item.id
      }
    })
  })
  // console.log(deviceOptions[deviceType])
}

// 告警点位重叠时，只显示一个，其余隐藏





// 定义全局变量
let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  labelRenderer: CSS2DRenderer,
  controls: OrbitControls

// 初始化
const init = () => {
  initScene()
  initCamera()
  initRenderer()
  initLight()
  initControls()
  initContent()
  // initHelper()

  addEventListener('resize', onWindowResize, false)
  addEventListener('dblclick', onMouseDblclick, false)
}

// 创建场景
const initScene = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#050a24')
}

// 创建相机
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(
    50, // 相机视野
    innerWidth / innerHeight, // 水平方向和竖直方向长度的比值
    1, // 近端渲染距离
    3000 // 远端渲染距离
  )

  camera.position.set(-200, 700, 450)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
}

// 创建渲染器
const initRenderer = () => {
  const containerDom = document.querySelector('#model-container')

  if (containerDom) {
    // 全局渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(innerWidth, innerHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    containerDom.appendChild(renderer.domElement)

    // 标签渲染器
    labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(innerWidth, innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.left = '0px'
    labelRenderer.domElement.style.pointerEvents = 'none'
    containerDom.appendChild(labelRenderer.domElement)
  }
}

// 创建光源
const initLight = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)
}

// 创建相机控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement)

  controls.minDistance = 10
  controls.maxDistance = 1000
  controls.maxPolarAngle = Math.PI / 2 - 0.1

  // 设置阻尼
  // controls.enableDamping = true
  // controls.dampingFactor = 0.2
}

// 加载场景内容
const initContent = () => {
  let texture: THREE.Texture
  const baseUrl = '/model-statics'

  // 加载天空hdr贴图
  const texLoader = new RGBELoader()
  texLoader.loadAsync(baseUrl + '/pure-sky.hdr').then((tex: THREE.Texture) => {
    // 如何将图像应用到对象
    tex.mapping = THREE.EquirectangularReflectionMapping
    texture = tex
  })

  // 加载模型
  const loader = new GLTFLoader()

  //设置解压库文件路径
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(baseUrl + '/draco/')
  loader.setDRACOLoader(dracoLoader)

  loader.load(
    baseUrl + '/port-3d.draco.gltf',
    async (gltf: GLTF) => {
      showProgress.value = false
      group = gltf.scene
      // group.position.z = -50
      // group.position.x = 50

      // 将加载的材质texture设置给背景和环境光
      // scene.background = texture
      scene.environment = texture

   

      // 添加模型到场景
      scene.add(group)
    },
    (xhr: any) => {
      progress.value = Math.floor((xhr.loaded / xhr.total) * 100)
    }
  )
}

// 创建辅助对象
const initHelper = () => {
  // 坐标轴
  scene.add(new THREE.AxesHelper(15))
}






// 渲染函数
const render = () => {
  requestAnimationFrame(render)

  controls.update()

  // 执行渲染
  labelRenderer.render(scene, camera)
  renderer.render(scene, camera)
}

// 窗口变动自适应方法
const onWindowResize = () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  labelRenderer.setSize(innerWidth, innerHeight)
  renderer.setSize(innerWidth, innerHeight)
}

// 鼠标双击触发的方法
function onMouseDblclick(event: any) {
  // 获取 raycaster 和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
  const intersects = getIntersects(event)

  // 获取选中最近的 Mesh 对象
  if (intersects.length != 0 && intersects[0].object instanceof THREE.Mesh) {
    // const selectObject = intersects[0].object
    console.log(intersects[0].point)
  } else {
    alert('未选中 Mesh!')
  }
}

// 获取与射线相交的对象数组
function getIntersects(event: any) {
  event.preventDefault()

  // 声明 raycaster 和 mouse 变量
  let raycaster = new THREE.Raycaster()
  let mouse = new THREE.Vector2()

  // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
  raycaster.setFromCamera(mouse, camera)

  // 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
  let intersects = raycaster.intersectObjects(scene.children)

  //返回选中的对象
  return intersects
}

const onLabelClick = (orientation: string) => {
  emit('changeIndoor', orientation)
}

// 初始化所有点位弹窗都不可见
const hideAllMarkDialog = () => {
  for (let key in deviceOptions) {
    deviceOptions[key].map((item: any) => {
      item.show = false
      return item
    })
  }
}

const handleClick = (e: any, key: string, id: string, index: number) => {
  const show = !deviceOptions[key][index].show // 先保存要定义的数据

  // 其它点位全部初始化为false
  hideAllMarkDialog()

  deviceOptions[key][index].show = show

  if (deviceOptions[key][index].show) {
    nextTick(() => {
      // e.clientY 鼠标位置 e.offsetY鼠标距离元素顶部的位置 20为边距
      let y = e.clientY - e.offsetY - 20
      //鼠标移入
      const element: any = document.querySelector('#' + id)
      // console.log(element.children[1])
      var dialogRefHeight = element.children[1].offsetHeight
      // let dialogRefHeight = 0
      // switch (key) {
      //   case 'monitorOptions':
      //     dialogRefHeight = 360
      //     break
      //   case 'warningOptions':
      //     dialogRefHeight = 210
      //     break
      // }
      // console.log('点的顶部位置距离浏览器高度', y)
      // console.log('弹窗高度', dialogRefHeight)
      if (y - dialogRefHeight > 140) {
        // 向上显示
        element.children[1].style.top = -dialogRefHeight + 'px'
      } else {
        // 向下显示
        element.children[1].style.top = 30 + 'px'
      }
      if (key === 'monitorOptions') {
        markRef.value[id].initCloudConsoleDialog()
      }
    })
  }
}

const markRef = ref<any>({})
const getMarkRef = (el: any, id: string) => {
  markRef.value[id] = el
}

onUnmounted(() => {
  removeEventListener('resize', onWindowResize, false)
  removeEventListener('dblclick', onMouseDblclick, false)

})

</script>

<template>
  <div id="model-container" @click.stop="hideAllMarkDialog">

  </div>
</template>

<style scoped lang="scss">
#model-container {
  width: 100%;
  height: 100%;
  position: relative;
  left: 0;
  top: 0;

  .label {
    cursor: pointer;
    pointer-events: auto;
    &-text {
      padding: 4px 6px;
      background-color: rgba(8, 17, 63, 0.6);
      font-size: 12px;
      border-radius: 4px;
    }
  }

  :deep(.el-progress) {
    position: fixed;
    z-index: 10;
    width: 280px;
    top: 70%;
    left: 50%;
    transform: translate(-50%, -50%);

    .el-progress-bar__outer {
      height: 8px !important;
    }
  }
}
</style>

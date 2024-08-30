import * as THREE from 'three';
// 导入轨道控制器
import { OrbitControls } from '@three-ts/orbit-controls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';



export default class ThreeJS {
    scene: THREE.Scene | null = null;
    camera: THREE.PerspectiveCamera | null = null;
    renderer: THREE.WebGLRenderer | null = null;
    ambientLight: THREE.AmbientLight | null = null;
    mesh: THREE.Mesh | null = null;
    dom: HTMLElement | null = null;
    constructor(dom: HTMLElement) {
        this.dom = dom
        this.init();
    }

    init(): void {
        //1.创建场景
        this.scene = new THREE.Scene();
        this.setCamera();
        this.setRenderer();
        this.initContent();
        this.animate();
        this.controls();
        this.axes();

        // 监听画面变化，更新渲染画面
        window.addEventListener("resize", () => {
            this.reSize();
        });
        window.addEventListener('dblclick', this.onMouseDblclick.bind(this), false)
    }

    setCamera(): void {
        //2.长度宽度采用默认浏览器 返回以像素为单位的窗口的内部宽度和高度
        // 新建透视摄像机
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            1,
            3000
        );
        this.camera.position.set(-200, 700, 450)
    }

    setRenderer(): void {

        if (this.dom) {
            // 设置渲染器
            this.renderer = new THREE.WebGLRenderer(
                {
                    //抗锯齿属性，WebGLRenderer常用的一个属性

                    antialias: true,

                    alpha: true
                }
            );
            // 设置画布的大小
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1;
            // canvas 画布 renderer.domElement
            this.dom.appendChild(this.renderer.domElement);
        }

    }

    setLight(): void {
        // 设置环境光
        if (this.scene) {
            this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
            this.scene.add(this.ambientLight)
        }
    }

    setCube(): void {
        if (this.scene) {
            // 创建一个立体几何对象
            const geometry = new THREE.BoxGeometry();

            const material = new THREE.MeshBasicMaterial({ color: "#ffff00" }); //然后创建一个phong材质来处理着色，并传递给纹理映射
            this.mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
            this.scene.add(this.mesh); //网格模型添加到场景中
        }
    }
    // 渲染
    render(): void {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // 动画
    animate(): void {
        if (this.renderer && this.scene && this.camera) {
            requestAnimationFrame(this.animate.bind(this));
            this.render();
        }
    }
    // 创建轨道控制器
    controls(): void {
        if (this.camera && this.renderer?.domElement) {
            const control = new OrbitControls(this.camera, this.renderer.domElement);
            control.minDistance = 10
            control.maxDistance = 1000
            control.maxPolarAngle = Math.PI / 2 - 0.1
            control.enableDamping = true;
        }
    }
    // 添加坐标轴辅助器
    axes(): void {
        if (this.scene) {
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper)
        }
    }

    //监听画面变化，更新渲染画面
    reSize(): void {
        if (this.camera && this.renderer) {
            // 更新摄像头
            this.camera.aspect = window.innerWidth / window.innerHeight;
            //   更新摄像机的投影矩阵
            this.camera.updateProjectionMatrix();
            //   更新渲染器
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            //   设置渲染器的像素比
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }

    // 加载场景内容
    initContent(): void {
        let texture: THREE.Texture;
        //加载天空hdr贴图
        const texLoader = new RGBELoader();
        texLoader.loadAsync('/model-statics/pure-sky.hdr').then((tex: THREE.Texture) => {
            tex.mapping = THREE.EquirectangularReflectionMapping
            texture = tex
        });
        // 加载模型
        const loader = new GLTFLoader();
        // 设置解压库文件路径
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/model-statics/draco/');
        loader.setDRACOLoader(dracoLoader);
        loader.load(
            '/model-statics/port-3d.draco.gltf',
            async (gltf: GLTF) => {
                if (this.scene) {
                    // 将加载的材质texture设置给背景和环境光
                    this.scene.environment = texture;
                    this.scene.background = texture;
                    // 添加模型到场景
                    this.scene.add(gltf.scene);

                }
            }
        )
    }

    // 获取与射线相交的对象数组
    getIntersects(event: any) {
        event.preventDefault()
        if (this.camera && this.scene) {
            // 声明 raycaster 和 mouse 变量
            let raycaster = new THREE.Raycaster()
            let mouse = new THREE.Vector2()
            // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
            //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
            raycaster.setFromCamera(mouse, this.camera)
            // 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
            let intersects = raycaster.intersectObjects(this.scene.children)
            //返回选中的对象
            return intersects
        }
    }

    // 鼠标双击触发的方法
    onMouseDblclick(event: any): void {
        // 获取 raycaster 和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
        const intersects = this.getIntersects(event)
        if (intersects) {
            // 获取选中最近的 Mesh 对象
            if (intersects.length != 0 && intersects[0].object instanceof THREE.Mesh) {
                // const selectObject = intersects[0].object
                console.log(intersects[0].point)
            } else {
                alert('未选中 Mesh!')
            }
        }

    }


}
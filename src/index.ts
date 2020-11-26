import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import { vec3 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import { createStatsWidget } from './ui/stats-widget'
import { Model } from './lib/model'
import { debugLogger } from './lib/shame'
import {
  extTextureHalfFloat,
  extDisjointTimerQuery,
  extTextureFloat,
  extTextureHalfFloatLinear,
  extTextureFloatLinear, extDrawBuffers,
} from './lib/cap'
import { SpinController } from './lib/controller'
import { Mesh } from './lib/mesh'
import { InstancedMesh } from './lib/instanced_mesh'
import { DirectionalLight, Lights, PointLight } from './lib/light'
import { xyz } from './lib/swizzle'

// https://emscripten.org/docs/optimizing/Optimizing-WebGL.html
debugLogger()

const seed = (s: number) => () => {
  s = Math.sin(s) * 10000
  return s - Math.floor(s)
}
const rand = seed(1815)

let toLoad = {
  // Each entry in the manifest represents an asset to be loaded
  'blur.fsh': { type: 'text', src: 'shaders/blur.fsh' },
  'main.fsh': { type: 'text', src: 'shaders/main.fsh' },
  'main.vsh': { type: 'text', src: 'shaders/main.vsh' },
  'emissive.fsh': { type: 'text', src: 'shaders/emissive.fsh' },
  'pbr.fsh': { type: 'text', src: 'shaders/pbr.fsh' },
  'pbr_shadow.fsh': { type: 'text', src: 'shaders/pbr_shadow.fsh' },
  'pbr_shadow.vsh': { type: 'text', src: 'shaders/pbr_shadow.vsh' },
  'light_cube.fsh': { type: 'text', src: 'shaders/light_cube.fsh' },
  'light_cube.vsh': { type: 'text', src: 'shaders/light_cube.vsh' },
  'shadow_dir.vsh': { type: 'text', src: 'shaders/shadow_dir.vsh' },
  'shadow_dir.fsh': { type: 'text', src: 'shaders/shadow_dir.fsh' },
  'tonemap.fsh': { type: 'text', src: 'shaders/tonemap.fsh' },
  'screen.vsh': { type: 'text', src: 'shaders/screen.vsh' },
}

toLoad = Object.assign(toLoad)

const loading = {
  manifest: toLoad,
  onProgress: (progress: number, message: any) => {},
  onError: (err: Error) => {
    console.debug(err)
    console.error(err)
  },
  onDone: (assets: Record<string, string>) => {
    main(assets)
  },
}

const main = (assets: Record<string, string>) => {
  const regl = init()

  const fbo = regl.framebuffer({
    color: regl.texture({ width: 1, height: 1, wrap: 'clamp', format: 'rgba', type: 'half float', min: "nearest", mag: 'nearest'}), // main
    depth: true,
    stencil: false,
  })

  const cubeMesh = new Mesh(cube.positions, cube.indices, cube.normals)
  const planeMesh = new Mesh(plane.positions, plane.indices, plane.normals)
  const bunnyMesh = new Mesh(bunny.positions, bunny.cells)
  const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)

  const camera = createCamera(regl, controls, { position: [0, 3, 10] })

  const lights = new Lights()
  lights.push(new DirectionalLight(regl, 5.0, [1.0, 1.0, 0.5], [-1, 1, 1]))
  lights.push(new PointLight(regl, 300.0, [1, 1, 0.8], [-3, 2, -3], 10))
  lights.push(new PointLight(regl, 300.0, [1, 0, 0], [3, 2, 3], 10))
  lights.push(new PointLight(regl, 0.0, [0, 1, 0], [-3, 2, 3], 10))
  lights.push(new PointLight(regl, 0.0, [0, 0, 1], [3, 2, -3], 10))

  let mainConfig: REGL.DrawConfig = {
    vert: assets['pbr_shadow.vsh'],
    frag: assets['pbr_shadow.fsh'],
    cull: { enable: true, face: 'back' as REGL.FaceOrientationType },
    uniforms: { ao: 0.001 },
    framebuffer: fbo,
  }

  const emissiveDraw = regl({
    frag: assets['emissive.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
    framebuffer: fbo,
  })

  const pointShadowConf = {
    frag: assets['light_cube.fsh'],
    vert: assets['light_cube.vsh'],
    cull: { enable: true, face: 'back' as REGL.FaceOrientationType },
  }
  const pLightShadowDraws: REGL.DrawCommand[] = []
  lights.pointLightSetup(pLightShadowDraws, mainConfig, pointShadowConf)

  const dirShadowConf = {
    frag: assets['shadow_dir.fsh'],
    vert: assets['shadow_dir.vsh'],
    cull: { enable: true, face: 'back' as REGL.FaceOrientationType },
    uniforms: { ao: 0.001 },
  }
  const dirLightShadows: REGL.DrawCommand[] = []
  lights.dirLightSetup(dirLightShadows, mainConfig, dirShadowConf)

  const mainDraw = regl(mainConfig)

  const ctrl = SpinController
  const up: vec3 = [0, 1, 0]
  const scale = 0.2
  const y = 0.0
  const bunnyProps = []

  const N = 5
  for (let x = 0; x < N; x++) {
    for (let z = 0; z < N; z++) {
      const pos: vec3 = [x * (20 / N) - 6.6, y, z * (20 / N) - 6.6]
      bunnyProps.push(
        new Model(
          {
            albedo: [rand(), rand(), rand()],
            metallic: rand(),
            roughness: rand(),
          },
          pos,
          scale,
          -43,
          up,
          new ctrl(),
        ),
      )
    }
  }
  const bunnyModels = new InstancedMesh(regl, bunnyMesh, bunnyProps)
  const bunnyDraw = regl(bunnyModels.config({}))
  const planeModels = [new Model({ albedo: [0.1, 0.1, 0.1], metallic: 0.1, roughness: 0.9 }, [0, 0, 0], 100)]
  const planes = new InstancedMesh(regl, planeMesh, planeModels)
  const planeDraw = regl(planes.config({}))

  const lightProps: Model[] = []
  lights.forEach((light, i) => {
    if (light.on && light instanceof PointLight) {
      lightProps.push(new Model({ albedo: vec3.scale(vec3.create(), light.color, 10), metallic: 0, roughness: 0.025 }, xyz(light.position), 0.05))
    }
  })

  const lightsI = new InstancedMesh(regl, cubeMesh, lightProps)
  const lightBulbDraw = regl(lightsI.config({}))
  const lightScope = regl(lights.config())

  const drawToneMap = regl({
    frag: assets['tonemap.fsh'],
    vert: assets['screen.vsh'],
    attributes: { position: [-4, -4, 4, -4, 0, 4] },
    uniforms: {
      tex: fbo,
      wRcp: (context : REGL.DefaultContext) => context.viewportWidth,
      hRcp: (context : REGL.DefaultContext) => context.viewportHeight,
    },
    depth: { enable: false },
    count: 3,
  })

  const drawCalls: [REGL.DrawCommand, string][] = []
  pLightShadowDraws.forEach((n, i) => {
    drawCalls.push([n, `drawDepth${i}`])
  })
  drawCalls.push([mainDraw, 'main'])
  drawCalls.push([emissiveDraw, 'emissive'])
  drawCalls.push([drawToneMap, 'tone_map'])
  const statsWidget = createStatsWidget(drawCalls, regl)

  let prevTime = 0.0
  regl.frame(({ time, viewportWidth, viewportHeight }) => {
    const deltaTime = time - prevTime
    prevTime = time
    statsWidget.update(deltaTime)

    bunnyModels.update()

    fbo.resize(viewportWidth, viewportHeight)

    pLightShadowDraws.forEach((cmd) => {
      cmd(6, () => {
        regl.clear({ depth: 1 })
        bunnyDraw()
        planeDraw()
      })
    })

    camera(() => {
      lightScope(() => {
        mainDraw(() => {
          // clear the fbo from last time
          regl.clear({ color: [0.0, 0.0, 0.0, 255], depth: 1 })
          bunnyDraw()
          planeDraw()
        })
      })
      emissiveDraw(() => {
        lightBulbDraw()
      })
    })

    drawToneMap()
  })
}

const init = function (): REGL.Regl {
  const requestExtensions: string[] = []
  if (extDisjointTimerQuery()) {
    requestExtensions.push(extDisjointTimerQuery())
  }
  if (extTextureHalfFloat()) {
    requestExtensions.push(extTextureHalfFloat())
  }
  if (extTextureHalfFloatLinear()) {
    requestExtensions.push(extTextureHalfFloat())
  }
  if (extTextureFloat()) {
    requestExtensions.push(extTextureFloat())
  }
  if (extTextureFloatLinear()) {
    requestExtensions.push(extTextureFloatLinear())
  }
  if (extDrawBuffers()) {
    requestExtensions.push(extDrawBuffers())
  }

  // these are regarded as almost universally supported (famous last words)
  requestExtensions.push('ANGLE_instanced_arrays')
  requestExtensions.push('EXT_blend_minmax')
  requestExtensions.push('OES_element_index_uint')
  requestExtensions.push('OES_standard_derivatives')
  requestExtensions.push('OES_vertex_array_object')
  requestExtensions.push('WEBGL_debug_renderer_info')
  requestExtensions.push('WEBGL_lose_context')
  return REGL({
    extensions: requestExtensions,
    optionalExtensions: ['webgl_draw_buffers'],
    profile: true,
    attributes: { antialias: false },
  })
}

resl(loading)

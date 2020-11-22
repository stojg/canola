import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import type { vec3 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import { createStatsWidget } from './ui/stats-widget'
import { Model } from './lib/model'
import { debugLogger } from './lib/shame'
import { halfFloatTextureExt, queryTimerExt, textureFloatExt } from './lib/cap'
import { SpinController } from './lib/controller'
import { Mesh } from './lib/mesh'
import { InstancedMesh } from './lib/instanced_mesh'
import { Lights, PointLight } from './lib/light'
import { xyz } from './lib/swizzle'
import deepmerge from 'deepmerge'

// https://emscripten.org/docs/optimizing/Optimizing-WebGL.html
debugLogger()

const seed = (s: number) => () => {
  s = Math.sin(s) * 10000
  return s - Math.floor(s)
}
const rand = seed(1815)

let toLoad = {
  // Each entry in the manifest represents an asset to be loaded
  'main.fsh': { type: 'text', src: 'shaders/main.fsh' },
  'main.vsh': { type: 'text', src: 'shaders/main.vsh' },
  'emissive.fsh': { type: 'text', src: 'shaders/emissive.fsh' },
  'pbr.fsh': { type: 'text', src: 'shaders/pbr.fsh' },
  'pbr_shadow.fsh': { type: 'text', src: 'shaders/pbr_shadow.fsh' },
  'pbr_shadow.vsh': { type: 'text', src: 'shaders/pbr_shadow.vsh' },
  'light_cube.fsh': { type: 'text', src: 'shaders/light_cube.fsh' },
  'light_cube.vsh': { type: 'text', src: 'shaders/light_cube.vsh' },
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

  const cubeMesh = new Mesh(cube.positions, cube.indices, cube.normals)
  const planeMesh = new Mesh(plane.positions, plane.indices, plane.normals)
  const bunnyMesh = new Mesh(bunny.positions, bunny.cells)

  const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
  const camera = createCamera(regl, controls, { position: [0, 3, 10] })

  const lights = new Lights()
  // lights.push(new DirectionalLight(regl, 1.0,  [1.0, 1.0, 0.8], [-3, 3, -3]))
  lights.push(new PointLight(regl, 300.0, [1, 1, 0.8], [-3, 2, -3], 10))
  lights.push(new PointLight(regl, 300.0, [1, 0, 0], [3, 2, 3], 10))
  lights.push(new PointLight(regl, 0.0, [0, 1, 0], [-3, 2, 3], 10))
  lights.push(new PointLight(regl, 0.0, [0, 0, 1], [3, 2, -3], 10))

  const shadowConf = {
    frag: assets['light_cube.fsh'],
    vert: assets['light_cube.vsh'],
    cull: { enable: true, face: 'back' },
  }
  let mainConfig: REGL.DrawConfig = {
    vert: assets['pbr_shadow.vsh'],
    frag: assets['pbr_shadow.fsh'],
    cull: { enable: true, face: 'back' },
    uniforms: { ao: 0.001 },
  }

  const shadowCasters: REGL.DrawCommand[] = []
  lights.forEach((l, i) => {
    if (l.on) {
      shadowCasters.push(regl(l.depthDrawConfig(shadowConf)))
    }
    // @ts-ignore
    mainConfig.uniforms[`shadowCubes[${i}]`] = lights.get(i).shadowFBO()
  })

  const mainDraw = regl(mainConfig)

  const ctrl = SpinController
  const up: vec3 = [0, 1, 0]
  const scale = 0.2
  const y = 0.0
  const bunnyProps = []

  const N = 3
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

  const bunnies = new InstancedMesh(regl, bunnyMesh, bunnyProps)
  const bunnyDraw = regl(bunnies.config({}))
  const planeProps = [new Model({ albedo: [0.3, 0.3, 0.3], metallic: 0.1, roughness: 0.9 }, [0, 0, 0], 20)]
  const planes = new InstancedMesh(regl, planeMesh, planeProps)
  const planeDraw = regl(planes.config({}))

  const lightProps: Model[] = []
  lights.forEach((light, i) => {
    if (light.on && light instanceof PointLight) {
      lightProps.push(new Model({ albedo: light.color, metallic: 0, roughness: 0.025 }, xyz(light.position), 0.05))
    }
  })

  const lightsI = new InstancedMesh(regl, cubeMesh, lightProps)
  const lightBulbDraw = regl(lightsI.config({}))
  const lightScope = regl(lights.config())

  const emissiveDraw = regl({
    frag: assets['emissive.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
  })

  const drawCalls: [REGL.DrawCommand, string][] = []
  shadowCasters.forEach((n, i) => {
    drawCalls.push([n, `drawDepth${i}`])
  })
  drawCalls.push([mainDraw, 'main'])
  drawCalls.push([emissiveDraw, 'emissive'])
  const statsWidget = createStatsWidget(drawCalls, regl)

  let prevTime = 0.0
  regl.frame(({ time }) => {
    const deltaTime = time - prevTime
    prevTime = time
    statsWidget.update(deltaTime)

    bunnies.update()

    shadowCasters.forEach((cmd) => {
      cmd(6, () => {
        regl.clear({ depth: 1 })
        bunnyDraw()
        planeDraw()
      })
    })

    regl.clear({ color: [0.06, 0.06, 0.06, 255], depth: 1 })
    camera(() => {
      lightScope(() => {
        mainDraw(() => {
          bunnyDraw()
          planeDraw()
        })
      })
      emissiveDraw(() => {
        lightBulbDraw()
      })
    })
  })
}

const init = function (): REGL.Regl {
  const requestExtensions: string[] = []
  if (queryTimerExt()) {
    requestExtensions.push('EXT_disjoint_timer_query')
  }
  if (halfFloatTextureExt()) {
    requestExtensions.push(halfFloatTextureExt())
  }
  if (textureFloatExt()) {
    requestExtensions.push(textureFloatExt())
  }
  requestExtensions.push('oes_vertex_array_object')
  requestExtensions.push('ANGLE_instanced_arrays')
  return REGL({
    extensions: requestExtensions,
    optionalExtensions: ['oes_texture_float_linear'],
    profile: true,
    attributes: { antialias: true },
  })
}

resl(loading)

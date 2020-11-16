import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import { createStatsWidget } from './ui/stats-widget'
import { Model, ModelUniforms } from './lib/model'
import { Lights } from './lib/lights'
import { debugLogger } from './lib/shame'
import { halfFloatTextureExt, queryTimerExt, textureFloatExt } from './lib/cap'
import { SpinController } from './lib/controller'

debugLogger()

const loading = {
  manifest: {
    // Each entry in the manifest represents an asset to be loaded
    'main.fsh': { type: 'text', src: 'shaders/main.fsh' },
    'main.vsh': { type: 'text', src: 'shaders/main.vsh' },
    'emissive.fsh': { type: 'text', src: 'shaders/emissive.fsh' },
    'pbr.fsh': { type: 'text', src: 'shaders/pbr.fsh' },
    'pbr_shadow.fsh': { type: 'text', src: 'shaders/pbr_shadow.fsh' },
    'pbr_shadow.vsh': { type: 'text', src: 'shaders/pbr_shadow.vsh' },
    'light_cube.fsh': { type: 'text', src: 'shaders/light_cube.fsh' },
    'light_cube.vsh': { type: 'text', src: 'shaders/light_cube.vsh' },
  },
  onProgress: (progress: number, message: any) => {},
  onError: (err: Error) => {
    console.debug(err)
    console.error(err)
  },
  onDone: (assets: Record<string, string>) => {
    main(assets)
  },
}

interface MeshAttributes {
  position: vec3[]
  normal: vec3[]
  modelA: any
  modelB: any
  modelC: any
  modelD: any
}

const main = (assets: Record<string, string>) => {
  const regl = init()

  const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
  const camera = createCamera(regl, controls, { position: [0, 3, 10] })

  const lights = new Lights()
  lights.add(true, [1, 1, 0.5], [-3, 3, -3, 1], 3)
  lights.add(true, [1, 0, 0], [3, 3, 3, 1], 2)
  lights.add(false, [0, 1, 0], [-3, 3, 3, 1], 2)
  lights.add(false, [0, 0, 1], [3, 3, -3, 1], 4)

  const lightProps: any = []
  lights.all().forEach((light, i) => {
    if (!light.on) return
    const mtrl = { albedo: light.color, metallic: 0, roughness: 0.025, ao: 1.0 }
    lightProps.push(new Model(mtrl, xyz(light.pos), 0.05))
  })

  function lightCubeDraw(lightId: number): REGL.DrawConfig {
    const shadowFbo = lights.shadowFBO(regl, lightId)
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.1, 15.0)
    return {
      frag: assets['light_cube.fsh'],
      vert: assets['light_cube.vsh'],
      cull: { enable: true, face: 'back' },
      uniforms: {
        projectionView: (context: REGL.DefaultContext, props: any, batchId: number) => {
          switch (batchId) {
            case 0: // +x right
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 1: // -x left
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 2: // +y top
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights.get(lightId).pos)), [0, 0, 1]))
            case 3: // -y bottom
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights.get(lightId).pos)), [0, 0, -1]))
            case 4: // +z near
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 5: // -z far
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights.get(lightId).pos)), [0, -1, 0]))
          }
        },
      },
      framebuffer: function (context, props, batchId) {
        return shadowFbo.faces[batchId]
      },
    }
  }

  // render point-light shadows into a cubemap
  const drawDepth = [regl(lightCubeDraw(0)), regl(lightCubeDraw(1)), regl(lightCubeDraw(2)), regl(lightCubeDraw(3))]
  const oneLightScope = [regl(lights.lightUniform(regl, 0)), regl(lights.lightUniform(regl, 1)), regl(lights.lightUniform(regl, 2)), regl(lights.lightUniform(regl, 3))]

  const shadowDraw = regl({
    frag: assets['pbr_shadow.fsh'],
    vert: assets['pbr_shadow.vsh'],
    cull: { enable: true, face: 'back' },
    uniforms: {
      'shadowCubes[0]': lights.shadowFBO(regl, 0),
      'shadowCubes[1]': lights.shadowFBO(regl, 1),
      'shadowCubes[2]': lights.shadowFBO(regl, 2),
      'shadowCubes[3]': lights.shadowFBO(regl, 3),
      ao: 0.00001,
    },
  })

  const ctrl = SpinController
  const up: vec3 = [0, 1, 0]
  const scale = 0.2
  const bunnyProps = [
    new Model({ albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82 }, [0, 0, 0], scale, 45, up, new ctrl()),
    new Model({ albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75 }, [4, 0, 4], scale, -45, up, new ctrl()),
    new Model({ albedo: [0.0, 0.5, 0.0], metallic: 0.0, roughness: 0.025 }, [-4, 0, 4], scale, 90, up, new ctrl()),
    new Model({ albedo: [0.0, 0.5, 0.9], metallic: 5, roughness: 0.025 }, [-2, 0, 4], scale, 35, up, new ctrl()),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-6, 0, -6], scale, 70, up, new ctrl()),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [4, 0, -6], scale, 35, up, new ctrl()),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [6, 0, -5], scale, -43, up, new ctrl()),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [1, 0, -4], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-9, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-7, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-5, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-3, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [-1, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [1, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [3, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [5, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [7, 0, -9], scale, -70, up, new ctrl()),
    // new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025 }, [9, 0, -9], scale, -70, up, new ctrl()),
  ]

  const bunnyBuffer = regl.buffer({ data: [], type: 'float', length: bunnyProps.length, usage: 'dynamic' })
  const bunnyDraw = regl<ModelUniforms, MeshAttributes>({
    elements: bunny.cells,
    attributes: {
      position: bunny.positions,
      normal: normals(bunny.cells, bunny.positions),
      modelA: { buffer: bunnyBuffer, offset: 0, stride: 16 * 4, divisor: 1 },
      modelB: { buffer: bunnyBuffer, offset: 4 * 4, stride: 16 * 4, divisor: 1 },
      modelC: { buffer: bunnyBuffer, offset: 8 * 4, stride: 16 * 4, divisor: 1 },
      modelD: { buffer: bunnyBuffer, offset: 12 * 4, stride: 16 * 4, divisor: 1 },
    },
    instances: bunnyProps.length,
    uniforms: {
      albedo: [1, 1, 1],
      metallic: 0.75,
      roughness: 0.125,
    },
  })

  const planeProps = [new Model({ albedo: [0.1, 0.1, 0.1], metallic: 0.0, roughness: 1.0 }, [0, 0, 0], 20, 90, [1, 0, 0])]
  const cBuf: number[][] = []
  planeProps.forEach((l: Model) => {
    cBuf.push(l.model)
  })
  const planeBuffer: REGL.Buffer = regl.buffer({ data: cBuf, usage: 'static', type: 'float' })
  const planeDraw = regl<ModelUniforms, MeshAttributes>({
    elements: plane.indices,
    attributes: {
      position: plane.positions,
      normal: plane.normals,
      modelA: { buffer: planeBuffer, offset: 0, stride: 16 * 4, divisor: 1 },
      modelB: { buffer: planeBuffer, offset: 4 * 4, stride: 16 * 4, divisor: 1 },
      modelC: { buffer: planeBuffer, offset: 8 * 4, stride: 16 * 4, divisor: 1 },
      modelD: { buffer: planeBuffer, offset: 12 * 4, stride: 16 * 4, divisor: 1 },
    },
    instances: cBuf.length,
    uniforms: {
      albedo: [1, 1, 1],
      metallic: 0.0,
      roughness: 1.0,
    },
  })

  const buf: number[][] = []
  lightProps.forEach((l: Model) => {
    buf.push(l.model)
  })
  const lightBuffer = regl.buffer({ data: buf, usage: 'static', type: 'float' })
  const lightBulbDraw = regl<ModelUniforms, MeshAttributes>({
    elements: cube.indices,
    attributes: {
      position: cube.positions,
      normal: cube.normals,
      // @ts-ignore
      modelA: { buffer: lightBuffer, offset: 0, stride: 16 * 4, divisor: 1 },
      modelB: { buffer: lightBuffer, offset: 4 * 4, stride: 16 * 4, divisor: 1 },
      modelC: { buffer: lightBuffer, offset: 8 * 4, stride: 16 * 4, divisor: 1 },
      modelD: { buffer: lightBuffer, offset: 12 * 4, stride: 16 * 4, divisor: 1 },
    },
    instances: buf.length,
    uniforms: {
      albedo: [1, 1, 1],
    },
  })

  const allLightScope = regl(lights.allUniforms(regl))

  const emissiveDraw = regl({
    frag: assets['emissive.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
  })

  const drawCalls: [REGL.DrawCommand, string][] = []
  lights.lights.forEach((l, i) => {
    if (l.on) drawCalls.push([drawDepth[i], `lightmap${i}`])
  })
  drawCalls.push([shadowDraw, 'shadowed'])
  drawCalls.push([emissiveDraw, 'emissive'])
  const statsWidget = createStatsWidget(drawCalls, regl)

  let prevTime = 0.0
  regl.frame(({ time }) => {
    const deltaTime = time - prevTime
    prevTime = time
    statsWidget.update(deltaTime)

    bunnyProps.forEach((m) => m.update())
    const bBuf: mat4[] = []
    bunnyProps.forEach((l: Model) => {
      bBuf.push(l.model)
    })
    bunnyBuffer({ data: bBuf })

    for (let i = 0; i < lights.all().length; i++) {
      if (!lights.get(i).on) {
        continue
      }
      oneLightScope[i](() => {
        drawDepth[i](6, () => {
          regl.clear({ depth: 1 })
          bunnyDraw()
          planeDraw()
        })
      })
    }

    regl.clear({ color: [0.06, 0.06, 0.06, 255], depth: 1 })
    camera(() => {
      allLightScope(() => {
        shadowDraw(() => {
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

const xyz = (t: vec4) => vec3.fromValues(t[0], t[1], t[2])

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

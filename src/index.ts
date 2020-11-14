import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import createStatsWidget from 'regl-stats-widget'
import { Model, ModelUniforms } from './lib/model'
import { Lights } from './lib/lights'
import { errorLogger, printLimits } from './lib/shame'

interface Assets extends Record<string, string> {
}

const xyz = (t: vec4) => vec3.fromValues(t[0], t[1], t[2])

const loading = {
  manifest: {
    // Each entry in the manifest represents an asset to be loaded
    'main.fsh': { type: 'text', src: 'shaders/main.fsh' },
    'main.vsh': { type: 'text', src: 'shaders/main.vsh' },
    'emissive.fsh': { type: 'text', src: 'shaders/emissive.fsh' },
    'pbr.fsh': { type: 'text', src: 'shaders/pbr.fsh' },
    'pbr_shadow.fsh': { type: 'text', src: 'shaders/pbr_shadow.fsh' },
    'light_cube.fsh': { type: 'text', src: 'shaders/light_cube.fsh' },
  },
  onProgress: (progress: number, message: any) => {
    console.log(progress, message)
  },
  onError: (err: Error) => {
    console.error(err)
  },
  onDone: (assets: Assets) => {
    main(assets)
  },
}

interface MeshAttributes {
  position: vec3[]
  normal: vec3[]
}

resl(loading)


const main = (assets: Assets) => {
  const regl = REGL({
    extensions: [
      'oes_texture_float',
      'ext_disjoint_timer_query',
    ],
    profile: true,
    attributes: { antialias: true },
  })

  printLimits(regl)
  errorLogger()

  const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
  const camera = createCamera(regl, controls, { position: [0, 3, 10] })

  const lights = new Lights()
  lights.add(true, [10, 10, 10], [-3, 3, -3, 1])
  lights.add(false, [10, 0, 0], [3, 3, 3, 1])
  lights.add(false, [0, 10, 0], [-3, 3, 3, 1])
  lights.add(false, [0, 0, 10], [3, 3, -3, 1])

  const lightProps: any = []
  lights.all().forEach((light, i) => {
    if (!light.on) return
    const mtrl = { albedo: light.color, metallic: 0, roughness: 0.025, ao: 1.0 }
    lightProps.push(new Model(mtrl, xyz(light.pos), 0.05))
  })

  function lightCubeDraw(lightId: number): REGL.DrawConfig {
    const shadowFbo = lights.shadowFBO(regl, lightId)
    return {
      frag: assets['light_cube.fsh'],
      vert: assets['main.vsh'],
      cull: { enable: true, face: 'back' },
      uniforms: {
        projection: mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.25, 30.0),
        view: function(context: REGL.DefaultContext, props: any, batchId: number) {
          switch (batchId) {
            case 0: // +x right
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0])
            case 1: // -x left
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0])
            case 2: // +y top
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights.get(lightId).pos)), [0, 0, 1])
            case 3: // -y bottom
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights.get(lightId).pos)), [0, 0, -1])
            case 4: // +z near
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights.get(lightId).pos)), [0, -1, 0])
            case 5: // -z far
              return mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights.get(lightId).pos)), [0, -1, 0])
          }
        },
      },
      framebuffer: function(context, props, batchId) {
        return shadowFbo.faces[batchId]
      },
    }
  }

  // render point-light shadows into a cubemap
  const drawDepth = [regl(lightCubeDraw(0)), regl(lightCubeDraw(1)), regl(lightCubeDraw(2)), regl(lightCubeDraw(3))]
  const oneLightScope = [regl(lights.lightUniform(regl, 0)), regl(lights.lightUniform(regl, 1)), regl(lights.lightUniform(regl, 2)), regl(lights.lightUniform(regl, 3))]

  const shadowDraw = regl({
    frag: assets['pbr_shadow.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
    uniforms: {
      'shadowCubes[0]': lights.shadowFBO(regl, 0),
      'shadowCubes[1]': lights.shadowFBO(regl, 1),
      'shadowCubes[2]': lights.shadowFBO(regl, 2),
      'shadowCubes[3]': lights.shadowFBO(regl, 3),
    },
  })

  const scale = 0.2
  const bunnyProps = [
    new Model({ albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82, ao: 0.05 }, [0, 0, 0], scale, 45),
    new Model({ albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75, ao: 0.05 }, [4, 0, 4], scale, -45),
    new Model({ albedo: [0.0, 0.5, 0.0], metallic: 0.0, roughness: 0.025, ao: 0.05 }, [-4, 0, 4], scale, 90),
    new Model({ albedo: [0.0, 0.5, 0.9], metallic: 5, roughness: 0.025, ao: 0.05 }, [-2, 0, 4], scale, 35),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [-6, 0, -6], scale, 70),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [4, 0, -6], scale, 35),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [6, 0, -5], scale, -43),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [1, 0, -4], scale, -70),
  ]

  const bunnyDraw = regl<ModelUniforms, MeshAttributes>({
    elements: bunny.cells,
    attributes: { position: bunny.positions, normal: normals(bunny.cells, bunny.positions) },
    uniforms: Model.uniforms(regl),
  })

  const planeProps = [
    new Model(
      {
        albedo: [0.42, 0.4, 0.38],
        metallic: 0.0,
        roughness: 1.0,
        ao: 0.05,
      },
      [0, 0, 0],
      20,
      90,
      [1, 0, 0],
    ),
  ]

  const planeDraw = regl<ModelUniforms, MeshAttributes>({
    elements: plane.indices,
    attributes: { position: plane.positions, normal: plane.normals },
    uniforms: Model.uniforms(regl),
  })

  const lightBulbDraw = regl<ModelUniforms, MeshAttributes>({
    elements: cube.indices,
    attributes: { position: cube.positions, normal: cube.normals },
    uniforms: Model.uniforms(regl),
  })

  const allLightScope = regl(lights.allUniforms(regl))

  const plainDraw = regl({
    frag: assets['main.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
  })

  const emissiveDraw = regl({
    frag: assets['emissive.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
  })

  const statsWidget = createStatsWidget([
    [drawDepth[0], 'drawDepth0'],
    [drawDepth[1], 'drawDepth1'],
    [drawDepth[2], 'drawDepth2'],
    [drawDepth[3], 'drawDepth3'],
    [planeDraw, 'plane'],
    [bunnyDraw, 'bunnies'],
    [lightBulbDraw, 'lights'],
  ])

  regl.frame(({ tick }) => {
    const deltaTime = 0.01666666
    statsWidget.update(deltaTime)

    for (let i = 0; i < 4; i++) {
      if (!lights.get(i).on) {
        continue
      }
      oneLightScope[i](() => {
        drawDepth[i](6, () => {
          regl.clear({ depth: 1, color: [1, 1, 1, 1] })
          bunnyDraw(bunnyProps)
          planeDraw(planeProps)
        })
      })
    }

    regl.clear({ color: [0.05, 0.05, 0.05, 1] })
    camera(() => {
      allLightScope(() => {
        shadowDraw(() => {
          bunnyDraw(bunnyProps)
          planeDraw(planeProps)
        })
      })

      emissiveDraw(() => {
        lightBulbDraw(lightProps)
      })
    })
  })
}

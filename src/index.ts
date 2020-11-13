import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { vec3 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import createStatsWidget from 'regl-stats-widget'
import { Model, ModelUniforms } from './lib/model'

interface Assets extends Record<string, string> {
}

const loading = {
  manifest: {
    // Each entry in the manifest represents an asset to be loaded
    'main.fsh': {
      type: 'text', // the type declares the type of the asset
      src: 'shaders/main.fsh', // and src declares the URL of the asset
    },
    'main.vsh': {
      type: 'text', // the type declares the type of the asset
      src: 'shaders/main.vsh', // and src declares the URL of the asset
    },
    'pbr.fsh': {
      type: 'text', // the type declares the type of the asset
      src: 'shaders/pbr.fsh', // and src declares the URL of the asset
    },
  },
  onProgress: (progress: any, message: any) => {
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
    extensions: 'ext_disjoint_timer_query',
    profile: true,
    attributes: { antialias: true },
  })

  const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
  const camera = createCamera(regl, controls, { position: [0, 1.5, 10] })

  interface LightUniforms {
    'lights[0].color': vec3
    'lights[0].position': vec3
    'lights[1].color': vec3
    'lights[1].position': vec3
    'lights[2].color': vec3
    'lights[2].position': vec3
    'lights[3].color': vec3
    'lights[3].position': vec3
  }

  const lights = [
    { color: vec3.fromValues(100, 100, 100), pos: vec3.fromValues(-3, 3, -3) },
    { color: vec3.fromValues(100, 0, 0), pos: vec3.fromValues(3, 3, 3) },
    { color: vec3.fromValues(0, 100, 0), pos: vec3.fromValues(-3, 3, 3) },
    { color: vec3.fromValues(0, 0, 100), pos: vec3.fromValues(3, 3, -3) },
  ]
  const lightProps: any = []
  for (const i in lights) {
    lightProps.push(new Model({
      albedo: lights[i].color,
      metallic: 0,
      roughness: 0.025,
      ao: 1.0,
    }, lights[i].pos, 0.05))
  }

  const mainScope = regl({
    cull: { enable: true, face: 'back' },
  })

  const lightScope = regl<LightUniforms>({
    uniforms: {
      'lights[0].color': lights[0].color,
      'lights[0].position': lights[0].pos,
      'lights[1].color': lights[1].color,
      'lights[1].position': lights[1].pos,
      'lights[2].color': lights[2].color,
      'lights[2].position': lights[2].pos,
      'lights[3].color': lights[3].color,
      'lights[3].position': lights[3].pos,
    },
  })

  const bunnyProps = [
    new Model({ albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82, ao: 1.0 }, [0, 0, 0], 0.2, 45),
    new Model({ albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75, ao: 1.0 }, [4, 0, 4], 0.2, -45),
    new Model({ albedo: [0.0, 0.5, 0.0], metallic: 0.0, roughness: 0.025, ao: 1.0 }, [-4, 0, 4], 0.2, 90),
    new Model({ albedo: [0.0, 0.5, 0.9], metallic: 5, roughness: 0.025, ao: 1.0 }, [-2, 0, 4], 0.2, 35),
  ]

  const planeProps = [new Model({
    albedo: [0.42, 0.4, 0.38],
    metallic: 0.69,
    roughness: 0.08,
    ao: 0.0,
  }, [0, 0, 0], 20, 90, [1, 0, 0])]

  const planeDraw = regl<ModelUniforms, MeshAttributes>({
    frag: assets['pbr.fsh'],
    vert: assets['main.vsh'],
    elements: plane.indices,
    cull: { enable: true, face: 'back' },
    attributes: { position: plane.positions, normal: plane.normals },
    uniforms: Model.uniforms(regl),
  })

  const bunnyDraw = regl<ModelUniforms, MeshAttributes>({
    frag: assets['pbr.fsh'],
    vert: assets['main.vsh'],
    elements: bunny.cells,
    attributes: { position: bunny.positions, normal: normals(bunny.cells, bunny.positions) },
    uniforms: Model.uniforms(regl),
  })

  const lightDraw = regl<ModelUniforms, MeshAttributes>({
    frag: assets['main.fsh'],
    vert: assets['main.vsh'],
    elements: cube.indices,
    attributes: { position: cube.positions, normal: cube.normals },
    uniforms: Model.uniforms(regl),
  })

  const statsWidget = createStatsWidget([
    [planeDraw, 'plane'],
    [bunnyDraw, 'bunnies'],
    [lightDraw, 'lights'],
  ])

  regl.frame(() => {
    regl.clear({ color: [0.05, 0.05, 0.05, 1] })
    const deltaTime = 0.017
    statsWidget.update(deltaTime)

    mainScope(() => {
      camera(() => {
        lightScope(() => {
          bunnyDraw(bunnyProps)
          planeDraw(planeProps)
        })
        lightDraw(lightProps)
      })
    })
  })
}

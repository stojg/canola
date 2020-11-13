import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { vec3, vec4 } from 'gl-matrix'
import { FPSControls } from './lib/controls'
import { cube } from './models/cube'
import createStatsWidget from 'regl-stats-widget'
import { Model, ModelUniforms } from './lib/model'

interface Assets extends Record<string, string> {}

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
    'lights[0].on': boolean
    'lights[0].color': vec3
    'lights[0].position': vec4
    'lights[1].on': boolean
    'lights[1].color': vec3
    'lights[1].position': vec4
    'lights[2].on': boolean
    'lights[2].color': vec3
    'lights[2].position': vec4
    'lights[3].on': boolean
    'lights[3].color': vec3
    'lights[3].position': vec4
  }

  const lights = [
    { on: true, color: vec3.fromValues(100, 100, 100), pos: vec4.fromValues(-3, 3, -3, 1) },
    { on: true, color: vec3.fromValues(100, 0, 0), pos: vec4.fromValues(3, 3, 3, 1) },
    { on: true, color: vec3.fromValues(0, 100, 0), pos: vec4.fromValues(-3, 3, 3, 1) },
    { on: true, color: vec3.fromValues(0, 0, 100), pos: vec4.fromValues(3, 3, -3, 1) },
  ]
  const lightProps: any = []
  for (const i in lights) {
    if (!lights[i].on) continue
    lightProps.push(new Model({ albedo: lights[i].color, metallic: 0, roughness: 0.025, ao: 1.0 }, [lights[i].pos[0], lights[i].pos[1], lights[i].pos[2]], 0.05))
  }

  const mainScope = regl({
    cull: { enable: true, face: 'back' },
  })

  const lightScope = regl<LightUniforms>({
    uniforms: {
      'lights[0].on': lights[0].on,
      'lights[0].color': lights[0].color,
      'lights[0].position': lights[0].pos,
      'lights[1].on': lights[1].on,
      'lights[1].color': lights[1].color,
      'lights[1].position': lights[1].pos,
      'lights[2].on': lights[2].on,
      'lights[2].color': lights[2].color,
      'lights[2].position': lights[2].pos,
      'lights[3].on': lights[3].on,
      'lights[3].color': lights[3].color,
      'lights[3].position': lights[3].pos,
    },
  })

  const bunnyProps = [
    new Model({ albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82, ao: 0.05 }, [0, 0, 0], 0.2, 45),
    new Model({ albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75, ao: 0.05 }, [4, 0, 4], 0.2, -45),
    new Model({ albedo: [0.0, 0.5, 0.0], metallic: 0.0, roughness: 0.025, ao: 0.05 }, [-4, 0, 4], 0.2, 90),
    new Model({ albedo: [0.0, 0.5, 0.9], metallic: 5, roughness: 0.025, ao: 0.05 }, [-2, 0, 4], 0.2, 35),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [-6, 0, -6], 0.2, 70),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [4, 0, -6], 0.2, 35),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [6, 0, -5], 0.2, -43),
    new Model({ albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05 }, [1, 0, -4], 0.2, -70),
  ]

  const planeProps = [
    new Model(
      {
        albedo: [0.42, 0.4, 0.38],
        metallic: 0.69,
        roughness: 0.08,
        ao: 0.0,
      },
      [0, 0, 0],
      20,
      90,
      [1, 0, 0],
    ),
  ]

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

// https://github.com/regl-project/regl/blob/gh-pages/example/shadow-volume.js
// ----First pass: Normally draw mesh, no stencil buffer
const pass1 = {
  // use depth-buffer as usual.
  depth: { enable: true, mask: true, func: '<=' },
  // no stencil test
  stencil: { enable: false },
  // turn on color write
  colorMask: [true, true, true, true],
  // cull back-faces as usual.
  cull: { enable: true, face: 'back' },
}

// ---Second pass: Draw to stencil buffer
const pass2 = {
  depth: {
    mask: false, // don't write to depth buffer
    enable: true, // but DO use the depth test!
    func: '<',
  },

  // setup stencil buffer.
  stencil: {
    enable: true,
    mask: 0xff,
    func: {
      // stencil test always passes.
      // since we are only writing to the stencil buffer in this pass.
      cmp: 'always',
      ref: 0,
      mask: 0xff,
    },
    // as can be seen, basically we are doing Carmack's reverse.
    opBack: { fail: 'keep', zfail: 'increment wrap', zpass: 'keep' },
    opFront: { fail: 'keep', zfail: 'decrement wrap', zpass: 'keep' },
  },
  // do no culling. This means that we can write to the stencil
  // buffer in a single pass! So we handle both the backfaces and the frontfaces
  // in this pass.
  cull: { enable: false },

  // don't write to color buffer.
  colorMask: [false, false, false, false],
}

// ----Final pass: Draw mesh and overwrite the shadowed parts
const pass3 = {
  depth: {
    mask: false,
    enable: true,
    func: '<=',
  },

  // setup stencil buffer.
  stencil: {
    enable: true,
    mask: 0xff,
    // IF the stencil value at the fragment is not zero,
    // then by Carmack's reverse, the fragment is in shadow!
    func: {
      cmp: '!=',
      ref: 0,
      mask: 0xff,
    },
    // do no writing to stencil buffer in this pass.
    // we already did that in the previous pass.
    op: {
      fail: 'keep',
      zfail: 'keep',
      pass: 'keep',
    },
  },

  // DO write to color buffer.
  colorMask: [true, true, true, true],

  cull: {
    enable: true,
    face: 'back',
  },
}

import REGL from 'regl'
import resl from 'resl'
import { createCamera } from './lib/camera'
import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { mat4, vec3, vec4 } from 'gl-matrix'
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
    'pbr_shadow.fsh': {
      type: 'text', // the type declares the type of the asset
      src: 'shaders/pbr_shadow.fsh', // and src declares the URL of the asset
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
    extensions: ['oes_texture_float', 'ext_disjoint_timer_query'],
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
    { on: true, color: vec3.fromValues(100, 100, 100), pos: vec4.fromValues(0, 5, 0, 1) },
    // { on: true, color: vec3.fromValues(100, 100, 100), pos: vec4.fromValues(-3, 3, -3, 1) },
    { on: false, color: vec3.fromValues(100, 0, 0), pos: vec4.fromValues(3, 3, 3, 1) },
    { on: false, color: vec3.fromValues(0, 100, 0), pos: vec4.fromValues(-3, 3, 3, 1) },
    { on: false, color: vec3.fromValues(0, 0, 100), pos: vec4.fromValues(3, 3, -3, 1) },
  ]
  const lightProps: any = []
  for (const i in lights) {
    if (!lights[i].on) continue
    lightProps.push(
      new Model(
        {
          albedo: lights[i].color,
          metallic: 0,
          roughness: 0.025,
          ao: 1.0,
        },
        [lights[i].pos[0], lights[i].pos[1], lights[i].pos[2]],
        0.05,
      ),
    )
  }

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

  const xyz = (t: vec4) => vec3.fromValues(t[0], t[1], t[2])

  const CUBE_MAP_SIZE = 1024
  const shadowFbo = regl.framebufferCube({
    radius: CUBE_MAP_SIZE,
    colorFormat: 'rgba',
    colorType: 'float',
  })
  // render point-light shadows into a cubemap
  const drawDepth = regl({
    uniforms: {
      projection: mat4.perspective(mat4.create(), Math.PI / 2.0, 1.0, 0.05, 100.0),
      view: function (context, props, batchId) {
        switch (batchId) {
          case 0: // +x right
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights[0].pos)), [0, -1, 0])
          case 1: // -x left
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights[0].pos)), [0, -1, 0])
          case 2: // +y top
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights[0].pos)), [0, 0, 1])
          case 3: // -y bottom
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights[0].pos)), [0, 0, -1])
          case 4: // +z near
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights[0].pos)), [0, -1, 0])
          case 5: // -z far
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights[0].pos)), [0, -1, 0])
        }
      },
    },
    frag: `
  precision mediump float;
  // lights
  struct Light {
      vec3 color;
      vec4 position;
      bool on;
  };
  uniform Light lights[4];
  precision mediump float;
  varying vec3 vPosition;
  void main () {
    gl_FragColor = vec4(vec3(distance(vPosition, lights[0].position.xyz)), 1.0);
  }`,

    vert: `
  precision mediump float;
  attribute vec3 position;

  varying vec3 vPosition;
  uniform mat4 projection, view, model;
  void main() {
    vec4 p = model * vec4(position, 1.0);
    vPosition = p.xyz;
    gl_Position = projection * view * p;
  }`,

    framebuffer: function (context, props, batchId) {
      return shadowFbo.faces[batchId]
    },
  })

  const planeDraw = regl<ModelUniforms, MeshAttributes>({
    elements: plane.indices,
    attributes: { position: plane.positions, normal: plane.normals },
    uniforms: Model.uniforms(regl),
  })

  const bunnyDraw = regl<ModelUniforms, MeshAttributes>({
    elements: bunny.cells,
    attributes: { position: bunny.positions, normal: normals(bunny.cells, bunny.positions) },
    uniforms: Model.uniforms(regl),
  })

  const lightDraw = regl<ModelUniforms, MeshAttributes>({
    elements: cube.indices,
    attributes: { position: cube.positions, normal: cube.normals },
    uniforms: Model.uniforms(regl),
  })

  const normalDraw = regl({
    frag: assets['pbr.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
  })

  const shadowDraw = regl({
    frag: assets['pbr_shadow.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
    uniforms: {
      shadowCube: shadowFbo,
    },
  })

  const plainDraw = regl({
    frag: assets['main.fsh'],
    vert: assets['main.vsh'],
    cull: { enable: true, face: 'back' },
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

    lightScope(() => {
      drawDepth(6, () => {
        bunnyDraw(bunnyProps)
        planeDraw(planeProps)
      })
    })

    camera(() => {
      lightScope(() => {
        shadowDraw(() => {
          bunnyDraw(bunnyProps)
          planeDraw(planeProps)
        })
      })

      plainDraw(() => {
        lightDraw(lightProps)
      })
    })
  })
}

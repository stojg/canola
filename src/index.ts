import REGL from 'regl'
import { createCamera } from './lib/camera'

import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import { mat4, vec3 } from 'gl-matrix'
import { FPSControls } from './lib/controls'

const regl = REGL({
  attributes: {
    antialias: true,
  },
})

const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
const camera = createCamera(regl, controls, {
  position: vec3.fromValues(0, 10, 50),
})

const loadShaders = (fname: string, vname: string) => {
  const f = fetch(`/shaders/${fname}.fsh`).then((r) => r.text())
  const v = fetch(`/shaders/${vname}.vsh`).then((r) => r.text())
  return Promise.all([f, v])
}

const createModel = (position: vec3, scale: number): REGL.Mat4 => {
  const m = mat4.identity(new Float32Array(16))
  mat4.translate(m, m, position)
  mat4.scale(m, m, [scale, scale, scale])
  return m as REGL.Mat4
}

const bunnyProps = [
  {
    model: createModel(vec3.fromValues(0, 0, 0), 1),
    color: [0.0, 0.0, 0.8],
  },
  {
    model: createModel(vec3.fromValues(10, 0, 10), 1),
    color: [0.8, 0.0, 0.0],
  },
  {
    model: createModel(vec3.fromValues(-10, 0, 10), 1),
    color: [0.8, 0.8, 0.8],
  },
  {
    model: createModel(vec3.fromValues(-5, 0, -10), 1),
    color: [0.0, 0.8, 0.8],
  },
]

interface MeshUniforms {
  model: REGL.Mat4
  color: REGL.Vec3
  'lights[0].color': REGL.Vec3
  'lights[0].position': REGL.Vec3
}

interface MeshAttributes {
  position: REGL.Vec3[]
  normal: REGL.Vec3[]
}

const planeDraw = loadShaders('plane', 'plane').then(([f, v]) => {
  return regl<MeshUniforms, MeshAttributes>({
    frag: f,
    vert: v,
    attributes: {
      position: plane.positions,
      normal: plane.normals,
    },
    uniforms: {
      model: () => createModel(vec3.fromValues(0, 0, 0), 200),
      color: [0.1, 0.1, 0.1],
      'lights[0].color': [1, 1, 1],
      'lights[0].position': [10, 10, 10],
    },
    elements: plane.cells,
  })
})

const bunnyDraw = loadShaders('main', 'main').then(([f, v]) => {
  return regl<MeshUniforms, MeshAttributes>({
    frag: f,
    vert: v,
    attributes: {
      position: bunny.positions,
      normal: normals(bunny.cells, bunny.positions),
    },
    uniforms: {
      model: regl.prop<MeshUniforms, 'model'>('model'),
      color: regl.prop<MeshUniforms, 'color'>('color'),
      'lights[0].color': [1, 1, 1],
      'lights[0].position': [10, 10, 10],
    },
    elements: bunny.cells,
  })
})

Promise.all([planeDraw, bunnyDraw]).then((p) => {
  regl.frame(() => {
    regl.clear({ color: [0.05, 0.05, 0.05, 1] })
    camera(() => {
      p[0]()
      p[1](bunnyProps)
    })
  })
})

import REGL, {Vec2, Vec3} from 'regl'
import { createCamera } from './lib/camera'

import bunny from 'bunny'
import plane from './models/plane'
import normals from 'angle-normals'
import {glMatrix, mat4, vec2, vec3} from 'gl-matrix'
import { FPSControls } from './lib/controls'
import {cube} from "./models/cube"

const regl = REGL({
  attributes: {
    antialias: true,
  },
})

// look up resl - https://github.com/regl-project/resl
const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)
const camera = createCamera(regl, controls, {
  position: vec3.fromValues(0, 1.5, 10),
})

const loadShaders = (fname: string, vname: string) => {
  const f = fetch(`shaders/${fname}.fsh`).then((r) => r.text())
  const v = fetch(`shaders/${vname}.vsh`).then((r) => r.text())
  return Promise.all([f, v])
}

const createModel = (position: vec3, scale: number, deg: number = 0, rotAxis: vec3 = [0,1,0]): REGL.Mat4 => {
  const translation = mat4.identity(new Float32Array(16))
  mat4.translate(translation, translation, position)
  mat4.rotate(translation, translation, glMatrix.toRadian(deg), rotAxis)
  mat4.scale(translation, translation, [scale, scale, scale])
  return translation as REGL.Mat4
}

const lights = [
  {color: vec3.fromValues(100,100,100), pos: vec3.fromValues(-3,3,-3)},
  {color: vec3.fromValues(100,0,0), pos: vec3.fromValues(3,3,3)},
  {color: vec3.fromValues(0,100,0), pos: vec3.fromValues(-3,3,3)},
  {color: vec3.fromValues(0,0,100), pos: vec3.fromValues(3,3,-3)}
]

const bunnyProps = [
  {
    model: createModel(vec3.fromValues(0, 0, 0), 0.2, 45),
    albedo: vec3.fromValues(0.55, 0.55, 0.60),
    metallic: 0.25, // 0.0 - 1.0,
    roughness: 1 - 0.18, // 0.025 - 1.0
    ao: 1.0, // 0.0 - 1.0
  },
  {
    model: createModel(vec3.fromValues(4, 0, 4), 0.2, -45),
    albedo: vec3.fromValues(0.69, 0.27, 0.20),
    metallic: 0.20, // 0.0 - 1.0,
    roughness: 1 - 0.25, // 0.025 - 1.0
    ao: 1.0, // 0.0 - 1.0
  },
  {
    model: createModel(vec3.fromValues(-4, 0, 4), 0.2, 90),
    albedo: vec3.fromValues(0.0, 0.5, 0.0),
    metallic: 0, // 0.0 - 1.0,
    roughness: 0.025, // 0.025 - 1.0
    ao: 1.0, // 0.0 - 1.0
  },
  {
    model: createModel(vec3.fromValues(-2, 0, 4), 0.2, 35),
    albedo: vec3.fromValues(0.0, 0.5, 0.9),
    metallic: 0.5, // 0.0 - 1.0,
    roughness: 0.025, // 0.025 - 1.0
    ao: 1.0, // 0.0 - 1.0
  }
]

const lightProps : any = []
for (const i in lights) {
  lightProps.push({
    model: createModel(lights[i].pos, 0.05),
    albedo: lights[i].color,
    metallic: 0, // 0.0 - 1.0,
    roughness: 0.025, // 0.025 - 1.0
    ao: 1.0, // 0.0 - 1.0
  })
}

const planeProps = [{
  model: createModel(vec3.fromValues(0, 0, 0), 20, 90, [1,0,0]),
  albedo: [0.42, 0.40, 0.38],
  metallic: 0.69,
  roughness: 0.08,
  ao: 0.00,
}]

interface MeshUniforms {
  model: REGL.Mat4
  albedo: REGL.Vec3
  metallic: number,
  roughness: number,
  ao: number,
  'lights[0].color': vec3
  'lights[0].position': vec3
  'lights[1].color': vec3
  'lights[1].position': vec3
  'lights[2].color': vec3
  'lights[2].position': vec3
  'lights[3].color': vec3
  'lights[3].position': vec3
}

interface MeshAttributes {
  position: vec3[]
  normal: vec3[]
  // uv: vec2[]
}

const planeDraw = loadShaders('pbr', 'pbr').then(([f, v]) => {
  return regl<MeshUniforms, MeshAttributes>({
    frag: f, vert: v,
    elements: plane.indices,
    attributes: { position: plane.positions, normal: plane.normals },
    uniforms: {
      model: regl.prop<MeshUniforms, 'model'>('model'),
      albedo: regl.prop<MeshUniforms, 'albedo'>('albedo'),
      metallic: regl.prop<MeshUniforms, 'metallic'>('metallic'),
      roughness: regl.prop<MeshUniforms, 'roughness'>('roughness'),
      ao: regl.prop<MeshUniforms, 'ao'>('ao'),
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
})


const bunnyDraw = loadShaders('pbr', 'pbr').then(([f, v]) => {
  return regl<MeshUniforms, MeshAttributes>({
    frag: f, vert: v,
    elements: bunny.cells,
    attributes: { position: bunny.positions, normal: normals(bunny.cells, bunny.positions) },
    uniforms: {
      model: regl.prop<MeshUniforms, 'model'>('model'),
      albedo: regl.prop<MeshUniforms, 'albedo'>('albedo'),
      metallic: regl.prop<MeshUniforms, 'metallic'>('metallic'),
      roughness: regl.prop<MeshUniforms, 'roughness'>('roughness'),
      ao: regl.prop<MeshUniforms, 'ao'>('ao'),
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
})

const lightDraw = loadShaders('pbr', 'pbr').then(([f, v]) => {
  return regl<MeshUniforms, MeshAttributes>({
    frag: f, vert: v,
    elements: cube.indices,
    attributes: { position: cube.positions, normal: cube.normals },
    uniforms: {
      model: regl.prop<MeshUniforms, 'model'>('model'),
      albedo: regl.prop<MeshUniforms, 'albedo'>('albedo'),
      metallic: regl.prop<MeshUniforms, 'metallic'>('metallic'),
      roughness: regl.prop<MeshUniforms, 'roughness'>('roughness'),
      ao: regl.prop<MeshUniforms, 'ao'>('ao'),
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
})

Promise.all([planeDraw, bunnyDraw, lightDraw]).then((p) => {
  regl.frame(() => {
    regl.clear({ color: [0.05, 0.05, 0.05, 1] })
    camera(() => {
      p[0](planeProps)
      p[1](bunnyProps)
      p[2](lightProps)
    })
  })
})

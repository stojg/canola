import REGL from "regl"
import {createCamera} from './lib/camera'

import bunny from 'bunny'
import normals from 'angle-normals'
import {mat4, vec3} from "gl-matrix"
import {FPSControls} from "./lib/controls"

// https://sites.google.com/site/letsmakeavoxelengine/home/basic-block-rendering
const regl = REGL({
    attributes: {
        antialias: true
    }
})

const controls = new FPSControls(regl._gl.canvas as HTMLCanvasElement)

const loadShaders = (fname: string, vname: string) => {
    const f = fetch(`/shaders/${fname}.fsh`).then(r => r.text())
    const v = fetch(`/shaders/${vname}.vsh`).then(r => r.text())
    return Promise.all([f, v])
}

const camera = createCamera(regl, controls, {position: vec3.fromValues(0, 10, 100)})

interface MeshUniforms {
    model: REGL.Mat4
    color: REGL.Vec3
}

interface MeshAttributes {
    position: REGL.Vec3[]
    normal: REGL.Vec3[]
}

const bunnyProps: MeshUniforms[] = [{
    model: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    color: [0.0, 0.0, 0.8]
},{
    model: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 0, 10, 1],
    color: [0.8, 0.0, 0.0]
},{
    model: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -10, 0, 10, 1],
    color: [0.8, 0.8, 0.8]
}]

const planePosition : REGL.Vec3[] = []
planePosition.push([-0.5, 0.0, -0.5])
planePosition.push([+0.5, 0.0, -0.5])
planePosition.push([-0.5, 0.0, +0.5])
planePosition.push([+0.5, 0.0, +0.5])
const planeNormal : REGL.Vec3[] = []
planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])
const planeElements : REGL.Vec3[] = []
planeElements.push([3, 1, 0])
planeElements.push([0, 2, 3])

function createModel (position : vec3, scale : vec3) : REGL.Mat4 {
    const m = mat4.identity(new Float32Array(16))
    mat4.translate(m, m, position)
    mat4.scale(m, m, scale)
    return m as REGL.Mat4
}

const planeDraw = loadShaders('plane', 'plane').then(([f, v]) => {
    return regl<MeshUniforms, MeshAttributes>({
        frag: f, vert: v,
        attributes: {
            position: planePosition,
            normal: planeNormal
        },
        uniforms: {
            model: () => createModel(vec3.fromValues(0,0,0), vec3.fromValues(200,200,200)),
            color: [0.9, 0.9, 0.9],
        },
        elements: planeElements
    })
})

const bunnyDraw = loadShaders("bunny", "bunny").then(([f, v]) => {
    return regl<MeshUniforms, MeshAttributes>({
        frag: f, vert: v,
        attributes: {
            position: bunny.positions,
            normal: normals(bunny.cells, bunny.positions),
        },
        uniforms: {
            model: regl.prop<MeshUniforms, 'model'>('model'),
            color: regl.prop<MeshUniforms, 'color'>("color"),
        },
        elements: bunny.cells,
    })
})

Promise.all([planeDraw, bunnyDraw]).then((p) => {
    regl.frame(() => {
        regl.clear({color: [0.05, 0.05, 0.05, 1]})
        camera(() => {
            p[0]()
            p[1](bunnyProps)
        })
    })
})

/**
 *
 */



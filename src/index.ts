import REGL from "regl"
import {createCamera} from './lib/camera'

import bunny from 'bunny'
import normals from 'angle-normals'
import {vec3} from "gl-matrix"
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

const camera = createCamera(regl, controls, {position: vec3.fromValues(0, 0, 100)})

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

loadShaders("bunny", "bunny").then(([f, v]) => {

    const drawBunny = regl<MeshUniforms, MeshAttributes>({
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

    regl.frame(() => {
        regl.clear({color: [0.05, 0.05, 0.05, 1]})
        camera(() => {
            drawBunny(bunnyProps)
        })
    })
})


import type REGL from "regl"
import mouseChange from 'mouse-change'
import perspective from "gl-mat4/perspective"
import lookAt from "gl-mat4/lookAt"
import {mat4, vec3} from 'gl-matrix'
import mouseWheel from "mouse-wheel"

interface CameraProps {
    center? : number[],
    theta?: number,
    phi?: number,
    distance?: number,
    up?: number[],
    minDistance?: number,
    maxDistance?: number,
}

export function createOrthoCamera(regl: REGL.Regl, props: CameraProps) {
    const cameraState = {
        view: mat4.create(),
        projection: mat4.create(),
        center: props.center || vec3.create(),
        theta: props.theta || 0,
        phi: props.phi || 0,
        distance: props.distance || 1,
        eye: new Float32Array(3),
        up: new Float32Array(props.up || [0, 1, 0])
    }

    mat4.identity(cameraState.view)
    mat4.identity(cameraState.projection)

    const right = new Float32Array([1, 0, 0]);
    const front = new Float32Array([0, 0, 1])

    const minDistance = Math.log(props.minDistance || 0.1)
    const maxDistance = Math.log(props.maxDistance || 1000)

    let dtheta = 0
    let dphi = 0
    let ddistance = 0

    let prevX = 0
    let prevY = 0
    mouseChange(function (buttons : any, x: number, y: number) {
        if (buttons & 1) {
            const dx = (x - prevX) / window.innerWidth
            const dy = (y - prevY) / window.innerHeight
            const w = Math.max(cameraState.distance, 0.5)

            dtheta += w * dx
            dphi += w * dy
        }
        prevX = x
        prevY = y
    })

    mouseWheel(function (dx : number, dy: number) {
        ddistance += dy / window.innerHeight
    })

    function damp(x: number) {
        const xd = x * 0.9
        if (Math.abs(xd) < 0.1) {
            return 0
        }
        return xd
    }

    function clamp(x: number, lo: number, hi: number) {
        return Math.min(Math.max(x, lo), hi)
    }

    function updateCamera() {
        let center = cameraState.center
        let eye = cameraState.eye
        let up = cameraState.up

        cameraState.theta += dtheta
        cameraState.phi = clamp(
            cameraState.phi + dphi,
            -Math.PI / 2.0,
            Math.PI / 2.0)
        cameraState.distance = clamp(
            cameraState.distance + ddistance,
            minDistance,
            maxDistance)

        dtheta = damp(dtheta)
        dphi = damp(dphi)
        ddistance = damp(ddistance)

        let theta = cameraState.theta
        let phi = cameraState.phi
        let r = Math.exp(cameraState.distance)

        let vf = r * Math.sin(theta) * Math.cos(phi)
        let vr = r * Math.cos(theta) * Math.cos(phi)
        let vu = r * Math.sin(phi)

        for (let i = 0; i < 3; ++i) {
            eye[i] = center[i] + vf * front[i] + vr * right[i] + vu * up[i]
        }

        lookAt(cameraState.view, eye, center, up)
    }

    const injectContext = regl({
        context: Object.assign({}, cameraState, {
            projection: function (ctx : REGL.DefaultContext) {
                return perspective(cameraState.projection,
                    Math.PI / 4.0,
                    ctx.viewportWidth / ctx.viewportHeight,
                    0.01,
                    1000.0)
            }
        }),
        uniforms: Object.keys(cameraState).reduce((accumulator: any, name: string) => {
            // @ts-ignore
            accumulator[name] = regl.context(name)
            return accumulator
        }, {})
    })

    function setupCamera(block: any) {
        updateCamera()
        injectContext(block)
    }

    console.log('here')
    // Object.keys(cameraState).forEach((name: string) => {
    //     // @ts-ignore
    //     setupCamera[name] = cameraState[name]
    // })

    return setupCamera
}
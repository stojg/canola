import type REGL from "regl"
import {mat4, quat, vec3} from 'gl-matrix'
import {Transform} from "./transform"
import type {FPSControls, MetaButtons} from "./controls"

interface CameraProps {
    up?: REGL.Vec3,
    transform?: Transform
    position?: vec3,
    rotation?: quat
}

class Physics {
    velocity: vec3 = vec3.create()
    rotation: quat = quat.identity(new Float32Array(4))

    constructor() {
    }
}


export function createCamera(regl: REGL.Regl, controls: FPSControls, props: CameraProps) {
    const cameraState = {
        transform: props.transform || new Transform({
            position: props.position,
            rotation: props.rotation,
        }),
        view: mat4.identity(new Float32Array(16)),
        projection: mat4.identity(new Float32Array(16)),
        up: new Float32Array(props.up || [0, 1, 0]),
        yawChange: 0,
        pitchChange: 0,
        pointerLocked: false
    }

    function lerp(a: number, b: number, amount : number ) : number {
        return a * (1 - amount) + b * amount
    }

    function look() {
        const ptrSensitivity = 0.005
        const ptr = controls.pointerMovement()
        cameraState.yawChange = lerp(cameraState.yawChange, ptr[0] * ptrSensitivity,  0.5)
        cameraState.pitchChange = lerp(cameraState.pitchChange, ptr[1] * ptrSensitivity,  0.5)
        cameraState.transform.rotateXY(-cameraState.yawChange, -cameraState.pitchChange)
    }

    function move() {
        let move = vec3.create()
        let tmp = vec3.create()
        if (controls.keyPressed("w")) {
            vec3.transformQuat(tmp, [0, 0, -1], cameraState.transform.rotation)
            vec3.add(move, move, tmp)
        }
        if (controls.keyPressed("s")) {
            vec3.transformQuat(tmp, [0, 0, 1], cameraState.transform.rotation)
            vec3.add(move, move, tmp)
        }
        if (controls.keyPressed("a")) {
            vec3.transformQuat(tmp, [-1, 0, 0], cameraState.transform.rotation)
            vec3.add(move, move, tmp)
        }
        if (controls.keyPressed("d")) {
            vec3.transformQuat(tmp, [1, 0, 0], cameraState.transform.rotation)
            vec3.add(move, move, tmp)
        }
        const sensitivity = 0.5
        vec3.scale(move, move, sensitivity)
        cameraState.transform.addPosition(move)
    }

    function view() {
        // conjugate rotation because the world should appear to rotate opposite to the camera's rotation.
        const rotation: quat = quat.create()
        mat4.getRotation(rotation, cameraState.transform.transformation)
        quat.conjugate(rotation, rotation)

        // similar, the translation is inverted because the world appears to move opposite to the camera's movement.
        const translation = vec3.create()
        mat4.getTranslation(translation, cameraState.transform.transformation)
        vec3.negate(translation, translation)

        const cameraRotation = mat4.create()
        mat4.fromQuat(cameraRotation, rotation)
        const cameraTranslation = mat4.create()
        mat4.fromTranslation(cameraTranslation, translation)

        // now we can set the view
        mat4.multiply(cameraState.view, cameraRotation, cameraTranslation)
    }

    function update() {
        look()
        move()
        cameraState.transform.update()
        view()
    }

    const injectContext = regl({
        context: Object.assign({}, cameraState, {
            projection: function (ctx: REGL.DefaultContext) {
                return mat4.perspective(cameraState.projection, Math.PI / 4.0, ctx.viewportWidth / ctx.viewportHeight, 0.01, 1000.0)
            }
        }),
        uniforms: Object.keys(cameraState).reduce((accumulator: {}, name: string) => {
            // @ts-ignore
            accumulator[name] = regl.context(name)
            return accumulator
        }, {})
    })

    function render(block: any) {
        update()
        injectContext(block)
    }
    return render
}
import type REGL from 'regl'
import { glMatrix, mat4, quat, vec3 } from 'gl-matrix'
import { Transform } from './transform'
import type { FPSControls } from './controls'
import deepmerge from 'deepmerge'

interface CameraProps {
  up?: REGL.Vec3
  transform?: Transform
  position?: vec3
  rotation?: quat
}

interface CameraState {
  transform : Transform,
  yawChange: number
  pitchChange: number
  pointerLocked: boolean,
  up: vec3,
  projection: mat4,
  view: mat4,
}

export class Camera {

  regl: REGL.Regl
  props: CameraProps
  controls: FPSControls

  viewportWidth: number = 0
  viewportHeight: number = 0

  state : CameraState = {
    transform: new Transform({}),
    yawChange: 0,
    pitchChange: 0,
    pointerLocked: false,
    up: [0, 1, 0],
    projection: mat4.identity(new Float32Array(16)),
    view: mat4.identity(new Float32Array(16)),
  }

  constructor(regl: REGL.Regl, controls: FPSControls, props: CameraProps) {
    this.regl= regl
    this.props = props
    this.controls = controls
    this.state.transform = this.props.transform || new Transform({position: this.props.position, rotation: this.props.rotation })
  }

  get position() : vec3 {
    return this.state.transform.position
  }

  look() {
    const ptrSensitivity = 0.005
    const ptr = this.controls.pointerMovement()
    this.state.yawChange = lerp(this.state.yawChange, ptr[0] * ptrSensitivity, 0.5)
    this.state.pitchChange = lerp(this.state.pitchChange, ptr[1] * ptrSensitivity, 0.5)
    this.state.transform.rotateXY(-this.state.yawChange, -this.state.pitchChange)
  }

  move() {
    let move = vec3.create()
    let tmp = vec3.create()
    if (this.controls.keyPressed('w')) {
      vec3.transformQuat(tmp, [0, 0, -1], this.state.transform.rotation)
      vec3.add(move, move, tmp)
    }
    if (this.controls.keyPressed('s')) {
      vec3.transformQuat(tmp, [0, 0, 1], this.state.transform.rotation)
      vec3.add(move, move, tmp)
    }
    if (this.controls.keyPressed('a')) {
      vec3.transformQuat(tmp, [-1, 0, 0], this.state.transform.rotation)
      vec3.add(move, move, tmp)
    }
    if (this.controls.keyPressed('d')) {
      vec3.transformQuat(tmp, [1, 0, 0], this.state.transform.rotation)
      vec3.add(move, move, tmp)
    }
    const sensitivity = 0.1
    vec3.scale(move, move, sensitivity)
    this.state.transform.addPosition(move)
  }

  view() {
    // conjugate rotation because the world should appear to rotate opposite to the camera's rotation.
    const rotation: quat = quat.create()
    mat4.getRotation(rotation, this.state.transform.transformation)
    quat.conjugate(rotation, rotation)
    // similar, the translation is inverted because the world appears to move opposite to the camera's movement.
    const translation = vec3.create()
    mat4.getTranslation(translation, this.state.transform.transformation)
    vec3.negate(translation, translation)
    // convert from whatever it is back into mat4
    const cameraRotation = mat4.create()
    mat4.fromQuat(cameraRotation, rotation)
    const cameraTranslation = mat4.create()
    mat4.fromTranslation(cameraTranslation, translation)
    // now we can set the view
    mat4.multiply(this.state.view, cameraRotation, cameraTranslation)
  }

  update() {
    this.look()
    this.move()
    this.state.transform.update()
    this.view()
  }

  regenProjection(x : number, y: number) : boolean {
    return (x != this.viewportWidth || y != this.viewportHeight)
  }

  projection(viewportWidth: number, viewportHeight: number) : mat4 {
    if(!this.regenProjection(viewportWidth, viewportHeight)) {
      return this.state.projection
    }
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    return mat4.perspective(this.state.projection, glMatrix.toRadian(80), viewportWidth / viewportHeight, 0.01, 1000.0)
  }

  config(): REGL.DrawConfig {
    return {
      context: {
        projection: (ctx: REGL.DefaultContext) => this.projection(ctx.viewportWidth, ctx.viewportHeight),
      },
      uniforms: {
        // @ts-ignore
        projection: this.regl.context('projection'),
          view: () => this.state.view,
          camPos: () => this.position,
      }
    }
  }

  draw() {
    const config = this.config()
    const injectContext = this.regl(config)
    return (block: any) => {
      injectContext(block)
    }
  }
}

function lerp(a: number, b: number, amount: number): number {
  return a * (1 - amount) + b * amount
}

import {glMatrix, mat4, quat, vec3} from "../../web/gl-matrix.js";
import {Transform} from "./transform.js";
export class Camera {
  constructor(regl, controls, props) {
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.state = {
      transform: new Transform({}),
      yawChange: 0,
      pitchChange: 0,
      pointerLocked: false,
      up: [0, 1, 0],
      projection: mat4.identity(new Float32Array(16)),
      view: mat4.identity(new Float32Array(16))
    };
    this.regl = regl;
    this.props = props;
    this.controls = controls;
    this.state.transform = this.props.transform || new Transform({position: this.props.position, rotation: this.props.rotation});
  }
  get position() {
    return this.state.transform.position;
  }
  look() {
    const ptrSensitivity = 5e-3;
    const ptr = this.controls.pointerMovement();
    this.state.yawChange = lerp(this.state.yawChange, ptr[0] * ptrSensitivity, 0.5);
    this.state.pitchChange = lerp(this.state.pitchChange, ptr[1] * ptrSensitivity, 0.5);
    this.state.transform.rotateXY(-this.state.yawChange, -this.state.pitchChange);
  }
  move() {
    let move = vec3.create();
    let tmp = vec3.create();
    if (this.controls.keyPressed("w")) {
      vec3.transformQuat(tmp, [0, 0, -1], this.state.transform.rotation);
      vec3.add(move, move, tmp);
    }
    if (this.controls.keyPressed("s")) {
      vec3.transformQuat(tmp, [0, 0, 1], this.state.transform.rotation);
      vec3.add(move, move, tmp);
    }
    if (this.controls.keyPressed("a")) {
      vec3.transformQuat(tmp, [-1, 0, 0], this.state.transform.rotation);
      vec3.add(move, move, tmp);
    }
    if (this.controls.keyPressed("d")) {
      vec3.transformQuat(tmp, [1, 0, 0], this.state.transform.rotation);
      vec3.add(move, move, tmp);
    }
    const sensitivity = 0.1;
    vec3.scale(move, move, sensitivity);
    this.state.transform.addPosition(move);
  }
  view() {
    const rotation = quat.create();
    mat4.getRotation(rotation, this.state.transform.transformation);
    quat.conjugate(rotation, rotation);
    const translation = vec3.create();
    mat4.getTranslation(translation, this.state.transform.transformation);
    vec3.negate(translation, translation);
    const cameraRotation = mat4.create();
    mat4.fromQuat(cameraRotation, rotation);
    const cameraTranslation = mat4.create();
    mat4.fromTranslation(cameraTranslation, translation);
    mat4.multiply(this.state.view, cameraRotation, cameraTranslation);
  }
  update() {
    this.look();
    this.move();
    this.state.transform.update();
    this.view();
  }
  regenProjection(x, y) {
    return x != this.viewportWidth || y != this.viewportHeight;
  }
  projection(viewportWidth, viewportHeight) {
    if (!this.regenProjection(viewportWidth, viewportHeight)) {
      return this.state.projection;
    }
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    return mat4.perspective(this.state.projection, glMatrix.toRadian(80), viewportWidth / viewportHeight, 0.01, 1e3);
  }
  config() {
    return {
      context: {
        projection: (ctx) => this.projection(ctx.viewportWidth, ctx.viewportHeight)
      },
      uniforms: {
        projection: this.regl.context("projection"),
        view: () => this.state.view,
        camPos: () => this.position
      }
    };
  }
  draw() {
    const config = this.config();
    const injectContext = this.regl(config);
    return (block) => {
      injectContext(block);
    };
  }
}
function lerp(a, b, amount) {
  return a * (1 - amount) + b * amount;
}
//# sourceMappingURL=camera.js.map

import {glMatrix, mat4, quat, vec3} from "../../web/gl-matrix.js";
import {Transform} from "./transform.js";
export function createCamera(regl, controls, props) {
  const cameraState = {
    transform: props.transform || new Transform({
      position: props.position,
      rotation: props.rotation
    }),
    yawChange: 0,
    pitchChange: 0,
    pointerLocked: false,
    up: new Float32Array(props.up || [0, 1, 0]),
    projection: mat4.identity(new Float32Array(16)),
    view: mat4.identity(new Float32Array(16)),
    camPos: props.position
  };
  const uniforms = ["projection", "view", "camPos"];
  function look() {
    const ptrSensitivity = 5e-3;
    const ptr = controls.pointerMovement();
    cameraState.yawChange = lerp(cameraState.yawChange, ptr[0] * ptrSensitivity, 0.5);
    cameraState.pitchChange = lerp(cameraState.pitchChange, ptr[1] * ptrSensitivity, 0.5);
    cameraState.transform.rotateXY(-cameraState.yawChange, -cameraState.pitchChange);
  }
  function move() {
    let move2 = vec3.create();
    let tmp = vec3.create();
    if (controls.keyPressed("w")) {
      vec3.transformQuat(tmp, [0, 0, -1], cameraState.transform.rotation);
      vec3.add(move2, move2, tmp);
    }
    if (controls.keyPressed("s")) {
      vec3.transformQuat(tmp, [0, 0, 1], cameraState.transform.rotation);
      vec3.add(move2, move2, tmp);
    }
    if (controls.keyPressed("a")) {
      vec3.transformQuat(tmp, [-1, 0, 0], cameraState.transform.rotation);
      vec3.add(move2, move2, tmp);
    }
    if (controls.keyPressed("d")) {
      vec3.transformQuat(tmp, [1, 0, 0], cameraState.transform.rotation);
      vec3.add(move2, move2, tmp);
    }
    const sensitivity = 0.1;
    vec3.scale(move2, move2, sensitivity);
    cameraState.transform.addPosition(move2);
  }
  function view() {
    const rotation = quat.create();
    mat4.getRotation(rotation, cameraState.transform.transformation);
    quat.conjugate(rotation, rotation);
    const translation = vec3.create();
    mat4.getTranslation(translation, cameraState.transform.transformation);
    vec3.negate(translation, translation);
    const cameraRotation = mat4.create();
    mat4.fromQuat(cameraRotation, rotation);
    const cameraTranslation = mat4.create();
    mat4.fromTranslation(cameraTranslation, translation);
    mat4.multiply(cameraState.view, cameraRotation, cameraTranslation);
  }
  function update() {
    cameraState.camPos = vec3.clone(cameraState.transform.position);
    look();
    move();
    cameraState.transform.update();
    view();
  }
  const injectContext = regl({
    context: Object.assign({}, cameraState, {
      projection: (ctx) => mat4.perspective(cameraState.projection, glMatrix.toRadian(80), ctx.viewportWidth / ctx.viewportHeight, 0.01, 1e3)
    }),
    uniforms: Object.keys(cameraState).reduce((res, name) => {
      if (uniforms.includes(name)) {
        res[name] = regl.context(name);
      }
      return res;
    }, {})
  });
  function render(block) {
    update();
    injectContext(block);
  }
  return render;
}
function lerp(a, b, amount) {
  return a * (1 - amount) + b * amount;
}
//# sourceMappingURL=camera.js.map

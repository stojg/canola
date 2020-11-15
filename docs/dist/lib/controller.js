import {glMatrix, mat4} from "../../web/gl-matrix.js";
export class NullController {
  update(m) {
  }
}
export class SpinController {
  update(m) {
    const transform = mat4.clone(m.model);
    mat4.rotateY(transform, transform, glMatrix.toRadian(1));
    m.model = transform;
  }
}
//# sourceMappingURL=controller.js.map

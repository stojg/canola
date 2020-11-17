import {glMatrix, mat4} from "../../web/gl-matrix.js";
export class NullController {
  update(m) {
  }
}
export class SpinController {
  constructor() {
    this.speed = 0;
    this.speed = (Math.random() - 0.5) * 5;
  }
  update(m) {
    const transform = mat4.clone(m.model);
    mat4.rotateY(transform, transform, glMatrix.toRadian(this.speed));
    m.model = transform;
  }
}
//# sourceMappingURL=controller.js.map

import {quat, vec3} from "../../web/gl-matrix.js";
export class Physics {
  constructor() {
    this.velocity = vec3.create();
    this.rotation = quat.identity(new Float32Array(4));
  }
}
//# sourceMappingURL=physics.js.map

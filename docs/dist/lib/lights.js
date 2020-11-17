import {vec3} from "../../web/gl-matrix.js";
const CUBE_MAP_SIZE = 512;
const black = vec3.create();
export class Lights {
  constructor() {
    this.lights = [];
    this.shadowFBOs = [];
  }
  add(on, color, pos, radius) {
    this.lights.push({on, color, pos, radius});
    this.shadowFBOs.push();
  }
  get(idx) {
    return this.lights[idx];
  }
  shadowFBO(regl, id) {
    if (!(id in this.shadowFBOs)) {
      this.shadowFBOs[id] = regl.framebufferCube({
        radius: CUBE_MAP_SIZE,
        colorType: "half float"
      });
    }
    return this.shadowFBOs[id];
  }
  all() {
    return this.lights;
  }
  lightUniform(regl, idx) {
    return {
      uniforms: {
        "light.color": this.lights[idx].on ? this.lights[idx].color : black,
        "light.position": this.lights[idx].pos,
        "light.radius": this.lights[idx].radius
      }
    };
  }
  allUniforms(regl) {
    return {
      uniforms: this.luniforms()
    };
  }
  luniforms() {
    const a = {};
    this.lights.forEach((val, idx) => {
      a[`lights[${idx}].color`] = this.lights[idx].on ? this.lights[idx].color : black;
      a[`lights[${idx}].position`] = this.lights[idx].pos;
      a[`lights[${idx}].radius`] = this.lights[idx].radius;
    });
    return a;
  }
}
//# sourceMappingURL=lights.js.map

const CUBE_MAP_SIZE = 512;
export class Lights {
  constructor() {
    this.lights = [];
    this.shadowFBOs = [];
  }
  add(on, color, pos) {
    this.lights.push({on, color, pos});
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
  lightUniform(regl, id) {
    return {
      uniforms: {
        "light.on": this.lights[id].on,
        "light.color": this.lights[id].color,
        "light.position": this.lights[id].pos
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
      a[`lights[${idx}].on`] = this.lights[idx].on;
      a[`lights[${idx}].color`] = this.lights[idx].color;
      a[`lights[${idx}].position`] = this.lights[idx].pos;
    });
    return a;
  }
}
//# sourceMappingURL=lights.js.map

import {glMatrix, mat4, vec3} from "../../web/gl-matrix.js";
import deepmerge2 from "../../web/deepmerge.js";
import {xyz} from "./swizzle.js";
const POINT_LIGHT_CUBE_MAP_SIZE = 512;
const BLACK = vec3.fromValues(0, 0, 0);
export class Lights {
  constructor() {
    this.lights = [];
  }
  push(l) {
    this.lights.push(l);
  }
  config() {
    const a = {};
    this.lights.forEach((l, idx) => {
      a[`lights[${idx}].intensity`] = l.intensity;
      a[`lights[${idx}].position`] = l.position;
      a[`lights[${idx}].color`] = l.color;
    });
    console.log(a);
    return {
      uniforms: a
    };
  }
  forEach(callbackfn, thisArg) {
    this.lights.forEach(callbackfn, thisArg);
  }
  get(number) {
    return this.lights[number];
  }
}
export class Light {
  constructor(regl, intensity, clr, pos, fbo) {
    this._regl = regl;
    this._intensity = intensity;
    this._color = clr;
    this._position = pos;
    this._shadowFBO = fbo || regl.framebuffer({});
  }
  get on() {
    return this._intensity > 1e-3;
  }
  get intensity() {
    return this._intensity;
  }
  get position() {
    return this._position;
  }
  get color() {
    return this._color;
  }
  uniform() {
    return {
      uniforms: {
        "light.color": this.color,
        "light.position": this.position,
        "light.intensity": this.intensity
      }
    };
  }
  depthDrawConfig(previous = {}) {
    return previous;
  }
  shadowFBO() {
    return this._shadowFBO;
  }
}
export class DirectionalLight extends Light {
  constructor(regl, intensity, clr, pos) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 1]);
  }
}
export class PointLight extends Light {
  constructor(regl, intensity, clr, pos) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 0]);
    this._shadowFBO = regl.framebufferCube({
      radius: POINT_LIGHT_CUBE_MAP_SIZE,
      colorType: "half float"
    });
  }
  depthDrawConfig(previous = {}) {
    const shadowFbo = this._shadowFBO;
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.5, 15);
    return deepmerge2(previous, {
      uniforms: {
        "light.color": this.color,
        "light.position": this.position,
        "light.intensity": this.intensity,
        projectionView: (context, props, batchId) => {
          switch (batchId) {
            case 0:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(this.position)), [0, -1, 0]));
            case 1:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(this.position)), [0, -1, 0]));
            case 2:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(this.position)), [0, 0, 1]));
            case 3:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(this.position)), [0, 0, -1]));
            case 4:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(this.position)), [0, -1, 0]));
            case 5:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(this.position)), [0, -1, 0]));
          }
        }
      },
      framebuffer: function(context, props, batchId) {
        return shadowFbo.faces[batchId];
      }
    });
  }
}
//# sourceMappingURL=light.js.map

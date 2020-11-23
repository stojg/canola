import {glMatrix, mat4, vec3} from "../../web/gl-matrix.js";
import deepmerge2 from "../../web/deepmerge.js";
import {xyz} from "./swizzle.js";
const POINT_LIGHT_CUBE_MAP_SIZE = 256;
export class Lights {
  constructor() {
    this.lights = [];
  }
  push(l) {
    this.lights.push(l);
  }
  config() {
    const a = {};
    let pLights = 0;
    this.lights.forEach((l, idx) => {
      if (l instanceof PointLight) {
        a[`pointLights[${pLights}].intensity`] = l.intensity;
        a[`pointLights[${pLights}].position`] = l.position;
        a[`pointLights[${pLights}].color`] = l.color;
        a[`pointLights[${pLights}].radius`] = l.radius;
        a[`pointLights[${pLights}].invSqrRadius`] = 1 / (l.radius * l.radius);
        pLights++;
      } else if (l instanceof DirectionalLight) {
        a[`dirLight.intensity`] = l.intensity;
        a[`dirLight.position`] = l.position;
        a[`dirLight.color`] = l.color;
        a[`dirLight.radius`] = l.radius;
        a[`dirLight.invSqrRadius`] = 1 / (l.radius * l.radius);
      }
    });
    return {uniforms: a};
  }
  forEach(callbackfn, thisArg) {
    this.lights.forEach(callbackfn, thisArg);
  }
  get(number) {
    return this.lights[number];
  }
  pointLightSetup(pointLightShadows, mainConfig, shadowConf) {
    let pLights = 0;
    this.forEach((l, i) => {
      if (l instanceof PointLight) {
        if (!mainConfig.uniforms) {
          mainConfig.uniforms = {};
        }
        mainConfig.uniforms[`pointLightShadows[${pLights}]`] = l.shadowFBO();
        pLights++;
        if (l.on) {
          pointLightShadows.push(l.shadowDraw(shadowConf));
        }
      }
    });
  }
  dirLightSetup(dirLightShadows, mainConfig, dirShadowConf) {
  }
}
export class Light {
  constructor(regl, intensity, clr, pos, radius, fbo) {
    this._regl = regl;
    this._intensity = intensity;
    this._color = clr;
    this._position = pos;
    this._radius = radius || 0;
    this._shadowFBO = fbo || regl.framebuffer({});
  }
  get on() {
    return this._intensity > 1e-3;
  }
  get radius() {
    return this._radius;
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
        "light.intensity": this.intensity,
        "light.radius": this.radius,
        "light.invSqrRadius": 1 / (this.radius * this.radius)
      }
    };
  }
  shadowDraw(prevConfig) {
    return this._regl(this.depthDrawConfig(prevConfig));
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
    this._shadowFBO = regl.framebuffer({
      radius: POINT_LIGHT_CUBE_MAP_SIZE,
      colorType: "half float"
    });
  }
  depthDrawConfig(previous = {}) {
    let near = 1;
    let far = 7.5;
    const proj = mat4.ortho(mat4.create(), -10, 10, -10, 10, near, far);
    const view = mat4.create();
    mat4.lookAt(view, [0, 4, 0], [0, 0, 0], [0, 1, 0]);
    return deepmerge2(previous, {
      uniforms: {
        "light.position": this.position,
        projectionView: () => {
          return mat4.mul(mat4.create(), proj, view);
        }
      },
      framebuffer: this._shadowFBO
    });
  }
}
export class PointLight extends Light {
  constructor(regl, intensity, clr, pos, radius = 10) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 0], radius);
    this._shadowFBO = regl.framebufferCube({
      radius: POINT_LIGHT_CUBE_MAP_SIZE,
      colorType: "half float"
    });
  }
  depthDrawConfig(previous = {}) {
    const shadowFbo = this._shadowFBO;
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.1, this.radius);
    return deepmerge2(previous, {
      uniforms: {
        "light.position": this.position,
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

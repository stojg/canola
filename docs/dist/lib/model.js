import {glMatrix, mat4} from "../../web/gl-matrix.js";
import {NullController} from "./controller.js";
import deepmerge2 from "../../web/deepmerge.js";
export class Model {
  constructor(mtrl, pos, scale, deg = 0, rotAxis = [0, 1, 0], ctrl = new NullController()) {
    this.material = mtrl;
    this._model = Model.createModel(pos, scale, deg, rotAxis);
    this.controller = ctrl;
  }
  update() {
    if (this.controller != null) {
      this.controller.update(this);
    }
  }
  get model() {
    return this._model;
  }
  get bufferData() {
    return [
      this.model[0],
      this.model[1],
      this.model[2],
      this.model[3],
      this.model[4],
      this.model[5],
      this.model[6],
      this.model[7],
      this.model[8],
      this.model[9],
      this.model[10],
      this.model[11],
      this.model[12],
      this.model[13],
      this.model[14],
      this.model[15],
      this.albedo[0],
      this.albedo[1],
      this.albedo[2],
      this.metallic,
      this.roughness
    ];
  }
  set model(value) {
    this._model = value;
  }
  get albedo() {
    return this.material.albedo;
  }
  get metallic() {
    return this.material.metallic;
  }
  get roughness() {
    return this.material.roughness;
  }
  static config(prev, buf) {
    return deepmerge2(prev, {
      attributes: {
        modelA: {buffer: buf, offset: 0, stride: 21 * 4, divisor: 1},
        modelB: {buffer: buf, offset: 4 * 4, stride: 21 * 4, divisor: 1},
        modelC: {buffer: buf, offset: 8 * 4, stride: 21 * 4, divisor: 1},
        modelD: {buffer: buf, offset: 12 * 4, stride: 21 * 4, divisor: 1},
        albedo: {buffer: buf, offset: 16 * 4, stride: 21 * 4, divisor: 1},
        metallic: {buffer: buf, offset: 19 * 4, stride: 21 * 4, divisor: 1},
        roughness: {buffer: buf, offset: 20 * 4, stride: 21 * 4, divisor: 1}
      }
    });
  }
  static uniforms(regl) {
    return {
      model: regl.prop("model"),
      albedo: regl.prop("albedo"),
      metallic: regl.prop("metallic"),
      roughness: regl.prop("roughness")
    };
  }
  static createModel(position, scale, deg = 0, rotAxis = [0, 1, 0]) {
    const translation = mat4.identity(new Float32Array(16));
    mat4.translate(translation, translation, position);
    mat4.rotate(translation, translation, glMatrix.toRadian(deg), rotAxis);
    mat4.scale(translation, translation, [scale, scale, scale]);
    return translation;
  }
}
//# sourceMappingURL=model.js.map

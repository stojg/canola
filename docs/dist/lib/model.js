import {glMatrix, mat4} from "../../web/gl-matrix.js";
import {NullController} from "./controller.js";
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
  set model(value) {
    this._model = value;
  }
  get albedo() {
    return this.material.albedo;
  }
  get ao() {
    return this.material.ao;
  }
  get metallic() {
    return this.material.metallic;
  }
  get roughness() {
    return this.material.roughness;
  }
  static uniforms(regl) {
    return {
      model: regl.prop("model"),
      albedo: regl.prop("albedo"),
      metallic: regl.prop("metallic"),
      roughness: regl.prop("roughness"),
      ao: regl.prop("ao")
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

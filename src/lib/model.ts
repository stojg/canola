import { glMatrix, mat4, vec3 } from 'gl-matrix'
import type { Material } from './material'
import type REGL from 'regl'
import type { Controller } from './controller'
import { NullController } from './controller'

export interface ModelUniforms {
  model: mat4
  albedo: vec3
  metallic: number
  roughness: number
  ao: number
}

export class Model {
  private _model: mat4
  private material: Material
  private controller: Controller | null

  constructor(mtrl: Material, pos: vec3, scale: number, deg: number = 0, rotAxis: vec3 = [0, 1, 0], ctrl: Controller = new NullController()) {
    this.material = mtrl
    this._model = Model.createModel(pos, scale, deg, rotAxis)
    this.controller = ctrl
  }

  update() {
    if (this.controller != null) {
      this.controller.update(this)
    }
  }

  get model(): mat4 {
    return this._model
  }

  set model(value: mat4) {
    this._model = value
  }

  get albedo() {
    return this.material.albedo
  }

  get ao() {
    return this.material.ao
  }

  get metallic() {
    return this.material.metallic
  }

  get roughness() {
    return this.material.roughness
  }

  static uniforms(regl: REGL.Regl) {
    return {
      model: regl.prop<ModelUniforms, 'model'>('model'),
      albedo: regl.prop<ModelUniforms, 'albedo'>('albedo'),
      metallic: regl.prop<ModelUniforms, 'metallic'>('metallic'),
      roughness: regl.prop<ModelUniforms, 'roughness'>('roughness'),
      ao: regl.prop<ModelUniforms, 'ao'>('ao'),
    }
  }

  private static createModel(position: vec3, scale: number, deg: number = 0, rotAxis: vec3 = [0, 1, 0]): mat4 {
    const translation = mat4.identity(new Float32Array(16))
    mat4.translate(translation, translation, position)
    mat4.rotate(translation, translation, glMatrix.toRadian(deg), rotAxis)
    mat4.scale(translation, translation, [scale, scale, scale])
    return translation
  }
}

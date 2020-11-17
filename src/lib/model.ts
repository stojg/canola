import { glMatrix, mat4, vec3 } from 'gl-matrix'
import type { Material } from './material'
import type REGL from 'regl'
import type { Controller } from './controller'
import { NullController } from './controller'
import deepmerge from 'deepmerge'

export interface ModelUniforms {
  model: mat4
  albedo: vec3
  metallic: number
  roughness: number
}

export type BufferData = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]

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

  get bufferData(): BufferData {
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
      this.roughness,
    ]
  }

  set model(value: mat4) {
    this._model = value
  }

  get albedo() {
    return this.material.albedo
  }

  get metallic() {
    return this.material.metallic
  }

  get roughness() {
    return this.material.roughness
  }

  static config(prev: REGL.DrawConfig, buf: REGL.Buffer) {
    return deepmerge(prev, {
      attributes: {
        modelA: { buffer: buf, offset: 0, stride: 21 * 4, divisor: 1 },
        modelB: { buffer: buf, offset: 4 * 4, stride: 21 * 4, divisor: 1 },
        modelC: { buffer: buf, offset: 8 * 4, stride: 21 * 4, divisor: 1 },
        modelD: { buffer: buf, offset: 12 * 4, stride: 21 * 4, divisor: 1 },
        albedo: { buffer: buf, offset: 16 * 4, stride: 21 * 4, divisor: 1 },
        metallic: { buffer: buf, offset: 19 * 4, stride: 21 * 4, divisor: 1 },
        roughness: { buffer: buf, offset: 20 * 4, stride: 21 * 4, divisor: 1 },
      },
    })
  }

  static uniforms(regl: REGL.Regl) {
    return {
      model: regl.prop<ModelUniforms, 'model'>('model'),
      albedo: regl.prop<ModelUniforms, 'albedo'>('albedo'),
      metallic: regl.prop<ModelUniforms, 'metallic'>('metallic'),
      roughness: regl.prop<ModelUniforms, 'roughness'>('roughness'),
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

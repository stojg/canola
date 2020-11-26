import type { Mesh } from './mesh'
import { Model } from './model'
import type REGL from 'regl'
import deepmerge from 'deepmerge'
import { mat4, vec3 } from 'gl-matrix'

export class InstancedMesh {
  private mesh: Mesh
  models: Model[]
  private readonly buffer: REGL.Buffer
  private modelMeshConfig: REGL.DrawConfig<{}, {}, {}, {}, REGL.DefaultContext>

  constructor(regl: REGL.Regl, mesh: Mesh, models: Model[]) {
    this.mesh = mesh
    this.models = models
    this.buffer = regl.buffer({ data: [], type: 'float', length: models.length, usage: 'static' })
    this.modelMeshConfig = this.mesh.config(Model.config({}, this.buffer))
    this._updateBuffer()
  }

  config(prev: {}) {
    const inst = deepmerge(prev, { instances: this.models.length })
    return deepmerge(inst, this.modelMeshConfig)
  }

  update() {
    this.models.forEach((m) => m.update())
    this._updateBuffer()
  }

  private _updateBuffer() {
    const a: number[][] = []
    this.models.forEach((model: Model) => {
      a.push(model.bufferData)
    })
    this.buffer({ data: a })
  }

  sort(fromPosition: vec3) {
    this.models.sort((a,b ): number => {
      const aPos : vec3 = vec3.create()
      const bPos : vec3 = vec3.create()
      mat4.getTranslation(aPos, a.model)
      mat4.getTranslation(bPos, b.model)
      return vec3.sqrDist(fromPosition, aPos) - vec3.sqrDist(fromPosition, bPos)
    })



  }
}

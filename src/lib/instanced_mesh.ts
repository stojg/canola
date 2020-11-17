import type { Mesh } from './mesh'
import { Model } from './model'
import type REGL from 'regl'
import deepmerge from 'deepmerge'

export class InstancedMesh {
  private mesh: Mesh
  private models: Model[]
  private readonly buffer: REGL.Buffer
  private modelMeshConfig: REGL.DrawConfig<{}, {}, {}, {}, REGL.DefaultContext>

  constructor(regl: REGL.Regl, mesh: Mesh, models: Model[]) {
    this.mesh = mesh
    this.models = models
    this.buffer = regl.buffer({ data: [], type: 'float', length: models.length, usage: 'dynamic' })
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
    this.models.forEach((l: Model) => {
      a.push(l.bufferData)
    })
    this.buffer({ data: a })
  }
}

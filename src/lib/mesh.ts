import type { vec3 } from 'gl-matrix'
import calcNormals from 'angle-normals'
import type REGL from 'regl'
import deepmerge from 'deepmerge'

export class Mesh {
  vertices: vec3[] = []
  indices: vec3[] = []
  normals: vec3[] = []

  constructor(vertices: vec3[], indices: vec3[], normals?: vec3[]) {
    this.vertices = vertices
    this.indices = indices
    this.normals = normals || calcNormals(indices, vertices)
  }

  config(conf: REGL.DrawConfig): REGL.DrawConfig {
    return deepmerge(conf, {
      elements: this.indices,
      attributes: {
        position: this.vertices,
        normal: this.normals,
      },
    })
  }
}

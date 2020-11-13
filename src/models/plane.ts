import { vec2, vec3 } from 'gl-matrix'

const options = { size: 1, width: 1, height: 1 }

const indices: number[] = []
const positions: vec3[] = []
const normals: vec3[] = []
const uvs: vec2[] = []

const width: number = options.width || options.size || 1
const height: number = options.height || options.size || 1

// Vertices
const halfWidth = width / 2.0
const halfHeight = height / 2.0

positions.push(vec3.fromValues(-halfWidth, halfHeight, 0))
normals.push(vec3.fromValues(0, 0, -1.0))
uvs.push(vec2.fromValues(0.0, 1.0))

positions.push(vec3.fromValues(halfWidth, halfHeight, 0))
normals.push(vec3.fromValues(0, 0, -1.0))
uvs.push(vec2.fromValues(1.0, 1.0))

positions.push(vec3.fromValues(halfWidth, -halfHeight, 0))
normals.push(vec3.fromValues(0, 0, -1.0))
uvs.push(vec2.fromValues(1.0, 0.0))

positions.push(vec3.fromValues(-halfWidth, -halfHeight, 0))
normals.push(vec3.fromValues(0, 0, -1.0))
uvs.push(vec2.fromValues(0.0, 0.0))

// Indices
indices.push(0)
indices.push(1)
indices.push(2)

indices.push(0)
indices.push(2)
indices.push(3)

export default {
  positions: positions,
  normals: normals,
  uvs: uvs,
  indices: indices,
}

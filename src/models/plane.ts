import { vec2, vec3 } from 'gl-matrix'

const options = { size: 1, width: 1, height: 1 }

const uvs: vec2[] = []

const width: number = options.width || options.size || 1
const height: number = options.height || options.size || 1

// Vertices
const halfWidth = width / 2.0
const halfHeight = height / 2.0

uvs.push(vec2.fromValues(0.0, 1.0))
uvs.push(vec2.fromValues(1.0, 1.0))
uvs.push(vec2.fromValues(1.0, 0.0))
uvs.push(vec2.fromValues(0.0, 0.0))

const positions: vec3[] = [
  [-halfWidth, 0.0, -halfHeight],
  [+halfWidth, 0.0, -halfHeight],
  [-halfWidth, 0.0, +halfHeight],
  [+halfWidth, 0.0, +halfHeight],
]

const normals: vec3[] = [
  [0.0, 1.0, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 1.0, 0.0],
]

const indices: vec3[] = [
  [3, 1, 0],
  [0, 2, 3],
]
export default {
  positions: positions,
  normals: normals,
  uvs: uvs,
  indices: indices,
}

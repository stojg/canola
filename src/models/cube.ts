import type { vec2, vec3 } from 'gl-matrix'
import normals from 'angle-normals'

const cubePosition: vec3[] = [
  [-0.5, +0.5, +0.5],
  [+0.5, +0.5, +0.5],
  [+0.5, -0.5, +0.5],
  [-0.5, -0.5, +0.5], // positive z face.
  [+0.5, +0.5, +0.5],
  [+0.5, +0.5, -0.5],
  [+0.5, -0.5, -0.5],
  [+0.5, -0.5, +0.5], // positive x face
  [+0.5, +0.5, -0.5],
  [-0.5, +0.5, -0.5],
  [-0.5, -0.5, -0.5],
  [+0.5, -0.5, -0.5], // negative z face
  [-0.5, +0.5, -0.5],
  [-0.5, +0.5, +0.5],
  [-0.5, -0.5, +0.5],
  [-0.5, -0.5, -0.5], // negative x face.
  [-0.5, +0.5, -0.5],
  [+0.5, +0.5, -0.5],
  [+0.5, +0.5, +0.5],
  [-0.5, +0.5, +0.5], // top face
  [-0.5, -0.5, -0.5],
  [+0.5, -0.5, -0.5],
  [+0.5, -0.5, +0.5],
  [-0.5, -0.5, +0.5], // bottom face
]

const cubeUv: vec2[] = [
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // positive z face.
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // positive x face.
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // negative z face.
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // negative x face.
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // top face
  [0.0, 0.0],
  [1.0, 0.0],
  [1.0, 1.0],
  [0.0, 1.0], // bottom face
]

const cubeElements: vec3[] = [
  [2, 1, 0],
  [2, 0, 3], // positive z face.
  [6, 5, 4],
  [6, 4, 7], // positive x face.
  [10, 9, 8],
  [10, 8, 11], // negative z face.
  [14, 13, 12],
  [14, 12, 15], // negative x face.
  [18, 17, 16],
  [18, 16, 19], // top face.
  [20, 21, 22],
  [23, 20, 22], // bottom face
]

const cubeNormals: vec3[] = normals(cubeElements, cubePosition)

export const cube = {
  positions: cubePosition,
  normals: cubeNormals,
  uvs: cubeUv,
  indices: cubeElements,
}

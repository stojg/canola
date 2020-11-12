import type{Vec2, Vec3} from 'regl'

const options = { size: 1, width: 1, height: 1 }

const indices = []
const positions = []
const normals = []
const uvs = []

const width: number = options.width || options.size || 1
const height: number = options.height || options.size || 1

// Vertices
const halfWidth = width / 2.0
const halfHeight = height / 2.0

positions.push(-halfWidth, -halfHeight, 0);
normals.push(0, 0, -1.0);
uvs.push(0.0, 0.0);

positions.push(halfWidth, -halfHeight, 0);
normals.push(0, 0, -1.0);
uvs.push(1.0, 0.0);

positions.push(halfWidth, halfHeight, 0);
normals.push(0, 0, -1.0);
uvs.push(1.0, 1.0);

positions.push(-halfWidth, halfHeight, 0);
normals.push(0, 0, -1.0);
uvs.push(0.0, 1.0);

// Indices
indices.push(0);
indices.push(1);
indices.push(2);

indices.push(0);
indices.push(2);
indices.push(3);

export default {
  positions: positions as Vec3,
  normals: normals as Vec3,
  uvs: uvs as Vec2,
  indices: indices as Vec3,
}

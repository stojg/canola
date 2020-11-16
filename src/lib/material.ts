import type { vec3 } from 'gl-matrix'

export type Material = {
  albedo: vec3
  metallic: number // 0.0 - 1.0,
  roughness: number // 0.025 - 1.0
}

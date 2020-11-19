import { vec3, vec4 } from 'gl-matrix'

export const xyz = (t: vec4) => vec3.fromValues(t[0], t[1], t[2])

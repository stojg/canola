import { quat, vec3 } from 'gl-matrix';

export class Physics {
  velocity: vec3 = vec3.create();
  rotation: quat = quat.identity(new Float32Array(4));

  constructor() {}
}

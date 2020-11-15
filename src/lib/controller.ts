import type { Model } from './model'
import { glMatrix, mat4, quat } from 'gl-matrix'

export interface Controller {
  update(m: Model): void
}

export class NullController implements Controller {
  update(m: Model) {}
}

export class SpinController implements Controller {
  update(m: Model) {
    const transform: mat4 = mat4.clone(m.model)

    // Pitch Locally, Yaw Globally
    mat4.rotateY(transform, transform, glMatrix.toRadian(1))

    m.model = transform
  }
}

import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix'
import type REGL from 'regl'
import deepmerge from 'deepmerge'
import { xyz } from './swizzle'

// shadowFBOs: REGL.FramebufferCube[] = []
// this.shadowFBOs[id] = regl.framebufferCube({
//   radius: CUBE_MAP_SIZE,
//   colorType: 'half float',
// })

const POINT_LIGHT_CUBE_MAP_SIZE = 512
const BLACK = vec3.fromValues(0, 0, 0)

export class Lights {
  lights: Light[] = []

  push(l: Light) {
    this.lights.push(l)
  }

  config(): REGL.DrawConfig {
    const a: Record<string, any> = {}
    this.lights.forEach((l: Light, idx: number) => {
      a[`lights[${idx}].intensity`] = l.intensity
      a[`lights[${idx}].position`] = l.position
      a[`lights[${idx}].color`] = l.color
      a[`lights[${idx}].radius`] = l.radius
      a[`lights[${idx}].invSqrRadius`] = 1.0 / (l.radius*l.radius)
    })
    return { uniforms: a, }
  }

  forEach(callbackfn: (value: Light, index: number, array: Light[]) => void, thisArg?: any): void {
    this.lights.forEach(callbackfn, thisArg)
  }

  get(number: number): Light {
    return this.lights[number]
  }
}

export class Light {
  private _radius: number
  protected _shadowFBO: REGL.Resource
  protected _regl: REGL.Regl
  protected _intensity: number
  protected _color: vec3
  protected _position: vec4

  constructor(regl: REGL.Regl, intensity: number, clr: vec3, pos: vec4, radius? : number, fbo?: REGL.Resource) {
    this._regl = regl
    this._intensity = intensity
    this._color = clr
    this._position = pos
    this._radius = radius || 0.0
    this._shadowFBO = fbo || regl.framebuffer({})
  }

  get on(): boolean {
    return this._intensity > 0.001
  }

  get radius(): number {
    return this._radius
  }

  get intensity(): number {
    return this._intensity
  }

  get position(): vec4 {
    return this._position
  }

  get color(): vec3 {
    return this._color
  }

  uniform(): REGL.DrawConfig {
    return {
      uniforms: {
        'light.color': this.color,
        'light.position': this.position,
        'light.intensity': this.intensity,
        'light.radius': this.radius,
        'light.invSqrRadius': 1 / ( this.radius*this.radius),
      },
    }
  }

  depthDrawConfig(previous: {} = {}) {
    return previous
  }

  shadowFBO(): REGL.Resource {
    return this._shadowFBO
  }
}

export class DirectionalLight extends Light {
  constructor(regl: REGL.Regl, intensity: number, clr: vec3, pos: vec3) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 1])
  }
}

export class PointLight extends Light {
  _shadowFBO: REGL.FramebufferCube
  constructor(regl: REGL.Regl, intensity: number, clr: vec3, pos: vec3, radius: number = 10.0) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 0], radius)
    this._shadowFBO = regl.framebufferCube({
      radius: POINT_LIGHT_CUBE_MAP_SIZE,
      colorType: 'half float',
    })
  }

  depthDrawConfig(previous: {} = {}) {
    const shadowFbo = this._shadowFBO
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.1, this.radius)
    return deepmerge(previous, {
      uniforms: {
        'light.position': this.position,
        projectionView: (context: REGL.DefaultContext, props: any, batchId: number) => {
          switch (batchId) {
            case 0: // +x right
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(this.position)), [0, -1, 0]))
            case 1: // -x left
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(this.position)), [0, -1, 0]))
            case 2: // +y top
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(this.position)), [0, 0, 1]))
            case 3: // -y bottom
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(this.position)), [0, 0, -1]))
            case 4: // +z near
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(this.position)), [0, -1, 0]))
            case 5: // -z far
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(this.position)), [0, -1, 0]))
          }
        },
      },
      framebuffer: function (context: REGL.DefaultContext, props: {}, batchId: number) {
        return shadowFbo.faces[batchId]
      },
    })
  }
}

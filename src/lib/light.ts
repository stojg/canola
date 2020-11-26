import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix'
import type REGL from 'regl'
import deepmerge from 'deepmerge'
import { xyz } from './swizzle'

const POINT_LIGHT_CUBE_MAP_SIZE = 256

export class Lights {
  lights: Light[] = []

  push(l: Light) {
    this.lights.push(l)
  }

  config(): REGL.DrawConfig {
    const a: Record<string, any> = {}
    let pLights = 0
    this.lights.forEach((l: Light, idx: number) => {
      if (l instanceof PointLight) {
        a[`pointLights[${pLights}].intensity`] = l.intensity
        a[`pointLights[${pLights}].position`] = l.position
        a[`pointLights[${pLights}].color`] = l.color
        a[`pointLights[${pLights}].radius`] = l.radius
        a[`pointLights[${pLights}].invSqrRadius`] = 1.0 / (l.radius * l.radius)
        pLights++
      } else if (l instanceof DirectionalLight) {
        a[`dirLight.intensity`] = l.intensity
        a[`dirLight.position`] = l.position
        a[`dirLight.color`] = l.color
        a[`dirLight.radius`] = l.radius
        a[`dirLight.invSqrRadius`] = 1.0 / (l.radius * l.radius)
      }
    })
    return { uniforms: a }
  }

  forEach(callbackfn: (value: Light, index: number, array: Light[]) => void, thisArg?: any): void {
    this.lights.forEach(callbackfn, thisArg)
  }

  get(number: number): Light {
    return this.lights[number]
  }

  pointLightSetup(pointLightShadows: REGL.DrawCommand[], mainConfig: REGL.DrawConfig, shadowConf: REGL.DrawConfig) {
    let pLights = 0
    this.forEach((l, i) => {
      if (l instanceof PointLight) {
        if (!mainConfig.uniforms) {
          mainConfig.uniforms = {}
        }
        // @ts-ignore
        mainConfig.uniforms[`pointLightShadows[${pLights}]`] = l.shadowFBO()
        pLights++
        if (l.on) {
          pointLightShadows.push(l.shadowDraw(shadowConf))
        }
      }
    })
  }

  dirLightSetup(dirLightShadows: REGL.DrawCommand[], mainConfig: REGL.DrawConfig, dirShadowConf: REGL.DrawConfig) {
    // todo
  }
}

export class Light {
  private _radius: number
  protected _shadowFBO: REGL.Resource
  public _regl: REGL.Regl
  protected _intensity: number
  protected _color: vec3
  protected _position: vec4

  constructor(regl: REGL.Regl, intensity: number, clr: vec3, pos: vec4, radius?: number, fbo?: REGL.Resource) {
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
        'light.invSqrRadius': 1 / (this.radius * this.radius),
      },
    }
  }

  shadowDraw(prevConfig: REGL.DrawConfig): REGL.DrawCommand {
    return this._regl(this.depthDrawConfig(prevConfig))
  }

  depthDrawConfig(previous: {} = {}) {
    return previous
  }

  shadowFBO(): REGL.Resource {
    return this._shadowFBO
  }
}

export class DirectionalLight extends Light {
  _shadowFBO: REGL.Framebuffer
  constructor(regl: REGL.Regl, intensity: number, clr: vec3, pos: vec3) {
    super(regl, intensity, clr, [pos[0], pos[1], pos[2], 1])
    this._shadowFBO = regl.framebuffer({
      radius: POINT_LIGHT_CUBE_MAP_SIZE,
      colorType: 'half float',
    })
  }

  depthDrawConfig(previous: {} = {}) {
    let near = 1
    let far = 7.5
    const proj = mat4.ortho(mat4.create(), -10, 10, -10, 10, near, far)
    const view = mat4.create()
    mat4.lookAt(view, [0, 4, 0], [0, 0, 0], [0, 1, 0])
    return deepmerge(previous, {
      uniforms: {
        'light.position': this.position,
        projectionView: () => mat4.mul(mat4.create(), proj, view),
      },
      framebuffer: this._shadowFBO,
    })
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
    // @todo recalculate these values if the light moves or changes radius
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.1, this.radius)
    const sides = [
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(this.position)), [0, -1, 0])),
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(this.position)), [0, -1, 0])),
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(this.position)), [0, 0, 1])),
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(this.position)), [0, 0, -1])),
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(this.position)), [0, -1, 0])),
      mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(this.position), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(this.position)), [0, -1, 0])),
    ]

    const side = (i: number) => sides[i]
    return deepmerge(previous, {
      uniforms: {
        'light.position': this.position,
        projectionView: (context: REGL.DefaultContext, props: {}, batchId: number) => side(batchId),
      },
      framebuffer: (context: REGL.DefaultContext, props: {}, batchId: number) => this._shadowFBO.faces[batchId],
    })
  }
}

import type { vec3, vec4 } from 'gl-matrix'
import type REGL from 'regl'
import { textureFloatExt } from './cap'

interface Light {
  on: boolean
  color: vec3
  pos: vec4
}

const CUBE_MAP_SIZE = 512

const shadowConfig: REGL.FramebufferCubeOptions = {
  radius: CUBE_MAP_SIZE,
  colorFormat: 'rgba',
  colorType: textureFloatExt() ? 'float' : 'half float',
  stencil: false,
}

export class Lights {
  lights: Light[] = []
  shadowFBOs: REGL.FramebufferCube[] = []

  constructor() {}

  add(on: boolean, color: vec3, pos: vec4) {
    this.lights.push({ on: on, color: color, pos: pos })
    this.shadowFBOs.push()
  }

  get(idx: number): Light {
    return this.lights[idx]
  }

  shadowFBO(regl: REGL.Regl, id: number): REGL.FramebufferCube {
    if (!(id in this.shadowFBOs)) {
      this.shadowFBOs[id] = regl.framebufferCube(shadowConfig)
    }
    return this.shadowFBOs[id]
  }

  all(): Light[] {
    return this.lights
  }

  lightUniform(regl: REGL.Regl, id: number): REGL.DrawConfig {
    return {
      uniforms: {
        'light.on': this.lights[id].on,
        'light.color': this.lights[id].color,
        'light.position': this.lights[id].pos,
      },
    }
  }

  allUniforms(regl: REGL.Regl) {
    return {
      uniforms: this.luniforms(),
    }
  }

  private luniforms(): LightUniforms {
    const a: Record<string, any> = {}
    this.lights.forEach((val: Light, idx: number) => {
      a[`lights[${idx}].on`] = this.lights[idx].on
      a[`lights[${idx}].color`] = this.lights[idx].color
      a[`lights[${idx}].position`] = this.lights[idx].pos
    })
    return <LightUniforms>a
  }
}

interface LightUniforms {
  'lights[0].on': boolean
  'lights[0].color': vec3
  'lights[0].position': vec4
  'lights[1].on': boolean
  'lights[1].color': vec3
  'lights[1].position': vec4
  'lights[2].on': boolean
  'lights[2].color': vec3
  'lights[2].position': vec4
  'lights[3].on': boolean
  'lights[3].color': vec3
  'lights[3].position': vec4
}

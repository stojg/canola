import type { vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'
import type REGL from 'regl'

interface Light {
  on: boolean
  color: vec3
  pos: vec4
  radius: number
}

const CUBE_MAP_SIZE = 512

const black = vec3.create()

export class Lights {
  lights: Light[] = []
  shadowFBOs: REGL.FramebufferCube[] = []

  constructor() {}

  add(on: boolean, color: vec3, pos: vec4, radius: number) {
    this.lights.push({ on: on, color: color, pos: pos, radius: radius })
    this.shadowFBOs.push()
  }

  get(idx: number): Light {
    return this.lights[idx]
  }

  shadowFBO(regl: REGL.Regl, id: number): REGL.FramebufferCube {
    if (!(id in this.shadowFBOs)) {
      this.shadowFBOs[id] = regl.framebufferCube({
        radius: CUBE_MAP_SIZE,
        colorType: 'half float',
      })
    }
    return this.shadowFBOs[id]
  }

  all(): Light[] {
    return this.lights
  }

  lightUniform(regl: REGL.Regl, idx: number): REGL.DrawConfig {
    return {
      uniforms: {
        'light.color': this.lights[idx].on ? this.lights[idx].color : black,
        'light.position': this.lights[idx].pos,
        'light.radius': this.lights[idx].radius,
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
      a[`lights[${idx}].color`] = this.lights[idx].on ? this.lights[idx].color : black
      a[`lights[${idx}].position`] = this.lights[idx].pos
      a[`lights[${idx}].radius`] = this.lights[idx].radius
    })
    return <LightUniforms>a
  }
}

interface LightUniforms {
  'lights[0].radius': number
  'lights[0].color': vec3
  'lights[0].position': vec4
  'lights[1].radius': number
  'lights[1].color': vec3
  'lights[1].position': vec4
  'lights[2].radius': number
  'lights[2].color': vec3
  'lights[2].position': vec4
  'lights[3].radius': number
  'lights[3].color': vec3
  'lights[3].position': vec4
}

import type REGL from 'regl'
import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix'
import type { Lights } from './lights'
import { xyz } from './swizzle'

export class PointLightShadow {
  frag: string = ''
  vert: string = ''
  lights!: Lights
  drawCalls: REGL.DrawCommand[] = []
  uniforma: REGL.DrawCommand[] = []

  constructor() {}

  assets() {
    return {
      'light_cube.fsh': { type: 'text', src: 'shaders/light_cube.fsh' },
      'light_cube.vsh': { type: 'text', src: 'shaders/light_cube.vsh' },
    }
  }

  addLights(regl: REGL.Regl, l: Lights) {
    this.lights = l
    this.lights.all().forEach((light, idx) => {
      this.drawCalls.push(regl(this.config(regl, this.lights, idx)))
      this.uniforma.push(regl(this.lights.lightUniform(regl, idx)))
    })
  }

  drawDepth() {
    return this.drawCalls
  }

  lightUniforms() {
    return this.uniforma
  }

  config(regl: REGL.Regl, lights: Lights, lightId: number): REGL.DrawConfig {
    const shadowFbo = lights.shadowFBO(regl, lightId)
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.5, 15.0)

    return {
      frag: this.frag,
      vert: this.vert,
      cull: { enable: true, face: 'back' },
      uniforms: {
        projectionView: (context: REGL.DefaultContext, props: any, batchId: number) => {
          switch (batchId) {
            case 0: // +x right
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 1: // -x left
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 2: // +y top
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights.get(lightId).pos)), [0, 0, 1]))
            case 3: // -y bottom
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights.get(lightId).pos)), [0, 0, -1]))
            case 4: // +z near
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights.get(lightId).pos)), [0, -1, 0]))
            case 5: // -z far
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights.get(lightId).pos)), [0, -1, 0]))
          }
        },
      },
      framebuffer: function (context, props, batchId) {
        return shadowFbo.faces[batchId]
      },
    }
  }

  load(assets: Record<string, string>) {
    this.frag = assets['light_cube.fsh']
    this.vert = assets['light_cube.vsh']
  }
}

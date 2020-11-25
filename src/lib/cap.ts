import REGL from 'regl'

// see https://jdashg.github.io/misc/webgl/webgl-feature-levels.html

const supportedExtensions: string[] = []
export function hasExtension(check: string): string {
  // check
  if (supportedExtensions.length == 0) {
    const initialRegl = REGL({})
    const a = initialRegl._gl.getSupportedExtensions()
    initialRegl.destroy()
    if (a) {
      a.forEach((val) => {
        supportedExtensions.push(val.toUpperCase())
      })
    }
  }
  return supportedExtensions.includes(check.toUpperCase()) ? check : ''
}

export const isAppleDevice = () => /(iPad|iPhone|iPod)/g.test(navigator.userAgent)

export const extDisjointTimerQuery = () => hasExtension('EXT_disjoint_timer_query')
export const extTextureHalfFloat = () => hasExtension('OES_texture_half_float')
export const extTextureHalfFloatLinear = () => hasExtension('OES_texture_half_float_linear')
export const extTextureFloat = () => {
  return isAppleDevice() ? '' : hasExtension('OES_texture_float')
}
export const extTextureFloatLinear = () => hasExtension('OES_texture_float_linear')
export const extDrawBuffers = () => hasExtension('webgl_draw_buffers')

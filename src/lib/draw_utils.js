import { textureFloatExt } from './cap'

const fbo = regl.framebuffer({
  width: 1,
  height: 1,
  colorFormat: 'rgba',
  colorType: textureFloatExt() ? 'float' : 'half float',
  stencil: false,
})

const pbrFramebufferCommand = regl({ framebuffer: fbo })
// rember to     fbo.resize(viewportWidth, viewportHeight) on every tick
const drawToScreen = regl({
  frag: `
precision highp float;
varying vec2 uv;
uniform sampler2D tex;
const float exposure = 1.0;
const float gamma = 2.2;
void main()
{
    vec3 hdrColor = texture2D(tex, uv).rgb;
    // reinhard tone mapping
    vec3 result = hdrColor / (hdrColor + vec3(1.0));
    // also gamma correct while we're at it
    result = pow(result, vec3(1.0 / gamma));
    gl_FragColor = vec4(result, 1.0);
}`,
  vert: `
precision highp float;
attribute vec2 positions;
varying vec2 uv;
void main()
{
    uv = 0.5 * (positions + 1.0);
    gl_Position = vec4(positions, 0, 1);
}`,
  attributes: {
    positions: [-4, -4, 4, -4, 0, 4],
  },
  uniforms: {
    tex: fbo,
  },
  depth: { enable: false },
  count: 3,
  // framebuffer: null,
})

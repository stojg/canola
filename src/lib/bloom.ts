
// need this on top of shaders writing to the fbo.color[1] //#extension GL_EXT_draw_buffers : require

// dual fbo target textures
// create fbo. We set the size in `regl.frame`
// @ts-ignore
// const fbo = regl.framebuffer({
//   color: [
//     regl.texture({ width: 1, height: 1, wrap: 'clamp', format: 'rgba', type: 'half float'}), // main
//     regl.texture({ width: 1, height: 1, wrap: 'clamp', format: 'rgba', type: 'half float'}), // brightness
//   ],
//   depth: true,
//   stencil: false
// })

// const pingpongFBOs : REGL.Framebuffer[] = []
// pingpongFBOs.push(regl.framebuffer({colorType: "float", colorFormat: 'rgba', depthStencil: false, width: 1, height: 1}))
// pingpongFBOs.push(regl.framebuffer({colorType: "float", colorFormat: 'rgba', depthStencil: false, width: 1, height: 1}))
// const blurProps = [
//   // @ts-ignore
//   {in: fbo.color[1], out: pingpongFBOs[0]},
//   {in: pingpongFBOs[0], out: pingpongFBOs[1]},
//   {in: pingpongFBOs[1], out: pingpongFBOs[0]},
//   {in: pingpongFBOs[0], out: pingpongFBOs[1]},
//   {in: pingpongFBOs[1], out: pingpongFBOs[0]},
//   {in: pingpongFBOs[0], out: pingpongFBOs[1]},
// ]
//
// const drawBlurMap = regl({
//   frag: assets['blur.fsh'],
//   vert: assets['screen.vsh'],
//   attributes: { position: [ -4, -4, 4, -4, 0, 4 ] },
//   uniforms: {
//     tex: (context: REGL.DefaultContext, props: any) => props.in,
//     wRcp: ({viewportWidth}) => 1.0 / (viewportWidth),
//     hRcp: ({viewportHeight}) => 1.0 / (viewportHeight),
//     scale: (context: REGL.DefaultContext, props: any, batchId: number) => batchId % 2 == 0 ? [1,0] : [0,1],
//   },
//   depth: { enable: false },
//   count: 3,
//   framebuffer: (context: REGL.DefaultContext, props: any) => props.out,
// })


// happens before draw
// pingpongFBOs[0].resize(viewportWidth/1, viewportHeight/1)
// pingpongFBOs[1].resize(viewportWidth/1, viewportHeight/1)

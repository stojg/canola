//#extension GL_EXT_draw_buffers : require
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float ao;
varying vec3 Albedo;

void main()
{
    vec3 color = Albedo;
    gl_FragData[0] = vec4(color, 1.0);
//    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
//    gl_FragColor = vec4(color, 1.0);
//    if(brightness > 1.0) {
//        gl_FragData[1] = vec4(color, 1.0);
//    } else {
//        gl_FragData[1] = vec4(0.0,0.0,0.0, 1.0);
//    }
}

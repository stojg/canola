import REGL from "../web/regl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import normals from "../web/angle-normals.js";
import {mat4, vec3} from "../web/gl-matrix.js";
import {FPSControls} from "./lib/controls.js";
const regl2 = REGL({
  attributes: {
    antialias: true
  }
});
const controls2 = new FPSControls(regl2._gl.canvas);
const camera2 = createCamera(regl2, controls2, {
  position: vec3.fromValues(0, 10, 50)
});
const loadShaders = (fname, vname) => {
  const f = fetch(`/shaders/${fname}.fsh`).then((r) => r.text());
  const v = fetch(`/shaders/${vname}.vsh`).then((r) => r.text());
  return Promise.all([f, v]);
};
const createModel = (position, scale) => {
  const m = mat4.identity(new Float32Array(16));
  mat4.translate(m, m, position);
  mat4.scale(m, m, [scale, scale, scale]);
  return m;
};
const bunnyProps = [
  {
    model: createModel(vec3.fromValues(0, 0, 0), 1),
    color: [0, 0, 0.8]
  },
  {
    model: createModel(vec3.fromValues(10, 0, 10), 1),
    color: [0.8, 0, 0]
  },
  {
    model: createModel(vec3.fromValues(-10, 0, 10), 1),
    color: [0.8, 0.8, 0.8]
  },
  {
    model: createModel(vec3.fromValues(-5, 0, -10), 1),
    color: [0, 0.8, 0.8]
  }
];
const planeDraw = loadShaders("plane", "plane").then(([f, v]) => {
  return regl2({
    frag: f,
    vert: v,
    attributes: {
      position: plane2.positions,
      normal: plane2.normals
    },
    uniforms: {
      model: () => createModel(vec3.fromValues(0, 0, 0), 200),
      color: [0.1, 0.1, 0.1],
      "lights[0].color": [1, 1, 1],
      "lights[0].position": [10, 10, 10]
    },
    elements: plane2.cells
  });
});
const bunnyDraw = loadShaders("main", "main").then(([f, v]) => {
  return regl2({
    frag: f,
    vert: v,
    attributes: {
      position: bunny2.positions,
      normal: normals(bunny2.cells, bunny2.positions)
    },
    uniforms: {
      model: regl2.prop("model"),
      color: regl2.prop("color"),
      "lights[0].color": [1, 1, 1],
      "lights[0].position": [10, 10, 10]
    },
    elements: bunny2.cells
  });
});
Promise.all([planeDraw, bunnyDraw]).then((p) => {
  regl2.frame(() => {
    regl2.clear({color: [0.05, 0.05, 0.05, 1]});
    camera2(() => {
      p[0]();
      p[1](bunnyProps);
    });
  });
});
//# sourceMappingURL=index.js.map

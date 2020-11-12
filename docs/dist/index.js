import REGL from "../web/regl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import normals from "../web/angle-normals.js";
import {glMatrix, mat4, vec3} from "../web/gl-matrix.js";
import {FPSControls} from "./lib/controls.js";
import {cube as cube2} from "./models/cube.js";
const regl2 = REGL({
  attributes: {
    antialias: true
  }
});
const controls2 = new FPSControls(regl2._gl.canvas);
const camera2 = createCamera(regl2, controls2, {
  position: vec3.fromValues(0, 1.5, 10)
});
const loadShaders = (fname, vname) => {
  const f = fetch(`shaders/${fname}.fsh`).then((r) => r.text());
  const v = fetch(`shaders/${vname}.vsh`).then((r) => r.text());
  return Promise.all([f, v]);
};
const createModel = (position, scale, deg = 0, rotAxis = [0, 1, 0]) => {
  const translation = mat4.identity(new Float32Array(16));
  mat4.translate(translation, translation, position);
  mat4.rotate(translation, translation, glMatrix.toRadian(deg), rotAxis);
  mat4.scale(translation, translation, [scale, scale, scale]);
  return translation;
};
const lights = [
  {color: vec3.fromValues(100, 100, 100), pos: vec3.fromValues(-3, 3, -3)},
  {color: vec3.fromValues(100, 0, 0), pos: vec3.fromValues(3, 3, 3)},
  {color: vec3.fromValues(0, 100, 0), pos: vec3.fromValues(-3, 3, 3)},
  {color: vec3.fromValues(0, 0, 100), pos: vec3.fromValues(3, 3, -3)}
];
const bunnyProps = [
  {
    model: createModel(vec3.fromValues(0, 0, 0), 0.2, 45),
    albedo: vec3.fromValues(0.55, 0.55, 0.6),
    metallic: 0.25,
    roughness: 1 - 0.18,
    ao: 1
  },
  {
    model: createModel(vec3.fromValues(4, 0, 4), 0.2, -45),
    albedo: vec3.fromValues(0.69, 0.27, 0.2),
    metallic: 0.2,
    roughness: 1 - 0.25,
    ao: 1
  },
  {
    model: createModel(vec3.fromValues(-4, 0, 4), 0.2, 90),
    albedo: vec3.fromValues(0, 0.5, 0),
    metallic: 0,
    roughness: 0.025,
    ao: 1
  },
  {
    model: createModel(vec3.fromValues(-2, 0, 4), 0.2, 35),
    albedo: vec3.fromValues(0, 0.5, 0.9),
    metallic: 0.5,
    roughness: 0.025,
    ao: 1
  }
];
const lightProps = [];
for (const i in lights) {
  lightProps.push({
    model: createModel(lights[i].pos, 0.05),
    albedo: lights[i].color,
    metallic: 0,
    roughness: 0.025,
    ao: 1
  });
}
const planeProps = [{
  model: createModel(vec3.fromValues(0, 0, 0), 20, 90, [1, 0, 0]),
  albedo: [0.42, 0.4, 0.38],
  metallic: 0.69,
  roughness: 0.08,
  ao: 0
}];
const planeDraw = loadShaders("pbr", "pbr").then(([f, v]) => {
  return regl2({
    frag: f,
    vert: v,
    elements: plane2.indices,
    attributes: {position: plane2.positions, normal: plane2.normals},
    uniforms: {
      model: regl2.prop("model"),
      albedo: regl2.prop("albedo"),
      metallic: regl2.prop("metallic"),
      roughness: regl2.prop("roughness"),
      ao: regl2.prop("ao"),
      "lights[0].color": lights[0].color,
      "lights[0].position": lights[0].pos,
      "lights[1].color": lights[1].color,
      "lights[1].position": lights[1].pos,
      "lights[2].color": lights[2].color,
      "lights[2].position": lights[2].pos,
      "lights[3].color": lights[3].color,
      "lights[3].position": lights[3].pos
    }
  });
});
const bunnyDraw = loadShaders("pbr", "pbr").then(([f, v]) => {
  return regl2({
    frag: f,
    vert: v,
    elements: bunny2.cells,
    attributes: {position: bunny2.positions, normal: normals(bunny2.cells, bunny2.positions)},
    uniforms: {
      model: regl2.prop("model"),
      albedo: regl2.prop("albedo"),
      metallic: regl2.prop("metallic"),
      roughness: regl2.prop("roughness"),
      ao: regl2.prop("ao"),
      "lights[0].color": lights[0].color,
      "lights[0].position": lights[0].pos,
      "lights[1].color": lights[1].color,
      "lights[1].position": lights[1].pos,
      "lights[2].color": lights[2].color,
      "lights[2].position": lights[2].pos,
      "lights[3].color": lights[3].color,
      "lights[3].position": lights[3].pos
    }
  });
});
const lightDraw = loadShaders("pbr", "pbr").then(([f, v]) => {
  return regl2({
    frag: f,
    vert: v,
    elements: cube2.indices,
    attributes: {position: cube2.positions, normal: cube2.normals},
    uniforms: {
      model: regl2.prop("model"),
      albedo: regl2.prop("albedo"),
      metallic: regl2.prop("metallic"),
      roughness: regl2.prop("roughness"),
      ao: regl2.prop("ao"),
      "lights[0].color": lights[0].color,
      "lights[0].position": lights[0].pos,
      "lights[1].color": lights[1].color,
      "lights[1].position": lights[1].pos,
      "lights[2].color": lights[2].color,
      "lights[2].position": lights[2].pos,
      "lights[3].color": lights[3].color,
      "lights[3].position": lights[3].pos
    }
  });
});
Promise.all([planeDraw, bunnyDraw, lightDraw]).then((p) => {
  regl2.frame(() => {
    regl2.clear({color: [0.05, 0.05, 0.05, 1]});
    camera2(() => {
      p[0](planeProps);
      p[1](bunnyProps);
      p[2](lightProps);
    });
  });
});
//# sourceMappingURL=index.js.map

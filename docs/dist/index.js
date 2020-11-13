import REGL from "../web/regl.js";
import resl2 from "../web/resl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import normals from "../web/angle-normals.js";
import {glMatrix, mat4, vec3, vec4} from "../web/gl-matrix.js";
import {FPSControls} from "./lib/controls.js";
import {cube as cube2} from "./models/cube.js";
import createStatsWidget from "../web/regl-stats-widget.js";
import {Model} from "./lib/model.js";
const loading = {
  manifest: {
    "main.fsh": {
      type: "text",
      src: "shaders/main.fsh"
    },
    "main.vsh": {
      type: "text",
      src: "shaders/main.vsh"
    },
    "pbr.fsh": {
      type: "text",
      src: "shaders/pbr.fsh"
    },
    "pbr_shadow.fsh": {
      type: "text",
      src: "shaders/pbr_shadow.fsh"
    }
  },
  onProgress: (progress, message) => {
    console.log(progress, message);
  },
  onError: (err) => {
    console.error(err);
  },
  onDone: (assets) => {
    main(assets);
  }
};
resl2(loading);
const main = (assets) => {
  const regl2 = REGL({
    extensions: ["oes_texture_float", "ext_disjoint_timer_query"],
    profile: true,
    attributes: {antialias: true}
  });
  const controls2 = new FPSControls(regl2._gl.canvas);
  const camera2 = createCamera(regl2, controls2, {position: [0, 3, 10]});
  const lights = [
    {on: true, color: vec3.fromValues(100, 100, 100), pos: vec4.fromValues(0, 3, 0, 1)},
    {on: false, color: vec3.fromValues(100, 0, 0), pos: vec4.fromValues(3, 3, 3, 1)},
    {on: false, color: vec3.fromValues(0, 100, 0), pos: vec4.fromValues(-3, 3, 3, 1)},
    {on: false, color: vec3.fromValues(0, 0, 100), pos: vec4.fromValues(3, 3, -3, 1)}
  ];
  const lightProps = [];
  for (const i in lights) {
    if (!lights[i].on)
      continue;
    lightProps.push(new Model({
      albedo: lights[i].color,
      metallic: 0,
      roughness: 0.025,
      ao: 1
    }, [lights[i].pos[0], lights[i].pos[1], lights[i].pos[2]], 0.05));
  }
  const lightScope = regl2({
    uniforms: {
      "lights[0].on": lights[0].on,
      "lights[0].color": lights[0].color,
      "lights[0].position": lights[0].pos,
      "lights[1].on": lights[1].on,
      "lights[1].color": lights[1].color,
      "lights[1].position": lights[1].pos,
      "lights[2].on": lights[2].on,
      "lights[2].color": lights[2].color,
      "lights[2].position": lights[2].pos,
      "lights[3].on": lights[3].on,
      "lights[3].color": lights[3].color,
      "lights[3].position": lights[3].pos
    }
  });
  const bunnyProps = [
    new Model({albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82, ao: 0.05}, [0, 0, 0], 0.2, 45),
    new Model({albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75, ao: 0.05}, [4, 0, 4], 0.2, -45),
    new Model({albedo: [0, 0.5, 0], metallic: 0, roughness: 0.025, ao: 0.05}, [-4, 0, 4], 0.2, 90),
    new Model({albedo: [0, 0.5, 0.9], metallic: 5, roughness: 0.025, ao: 0.05}, [-2, 0, 4], 0.2, 35),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [-6, 0, -6], 0.2, 70),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [4, 0, -6], 0.2, 35),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [6, 0, -5], 0.2, -43),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [1, 0, -4], 0.2, -70)
  ];
  const planeProps = [
    new Model({
      albedo: [0.42, 0.4, 0.38],
      metallic: 0.69,
      roughness: 0.08,
      ao: 0
    }, [0, 0, 0], 20, 90, [1, 0, 0])
  ];
  const xyz = (t) => vec3.fromValues(t[0], t[1], t[2]);
  const CUBE_MAP_SIZE = 512;
  const shadowFbo = regl2.framebufferCube({
    radius: CUBE_MAP_SIZE,
    colorType: "float"
  });
  const drawDepth = regl2({
    viewport: {x: 0, y: 0, width: CUBE_MAP_SIZE, height: CUBE_MAP_SIZE},
    uniforms: {
      projection: mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.25, 30),
      view: function(context, props, batchId) {
        switch (batchId) {
          case 0:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights[0].pos)), [0, -1, 0]);
          case 1:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights[0].pos)), [0, -1, 0]);
          case 2:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights[0].pos)), [0, 0, 1]);
          case 3:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights[0].pos)), [0, 0, -1]);
          case 4:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights[0].pos)), [0, -1, 0]);
          case 5:
            return mat4.lookAt(mat4.create(), xyz(lights[0].pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights[0].pos)), [0, -1, 0]);
        }
      }
    },
    frag: `
  precision mediump float;
  // lights
  struct Light {
      vec3 color;
      vec4 position;
      bool on;
  };
  uniform Light lights[4];
  varying vec3 vPosition;
  void main () {
    gl_FragColor = vec4(vec3(distance(vPosition, lights[0].position.xyz)), 1.0);
  }`,
    vert: `
  precision mediump float;
  attribute vec3 position;

  varying vec3 vPosition;
  uniform mat4 projection, view, model;
  void main() {
    vec4 p = model * vec4(position, 1.0);
    vPosition = p.xyz;
    gl_Position = projection * view * p;
  }`,
    framebuffer: function(context, props, batchId) {
      return shadowFbo.faces[batchId];
    }
  });
  const planeDraw = regl2({
    elements: plane2.indices,
    attributes: {position: plane2.positions, normal: plane2.normals},
    uniforms: Model.uniforms(regl2)
  });
  const bunnyDraw = regl2({
    elements: bunny2.cells,
    attributes: {position: bunny2.positions, normal: normals(bunny2.cells, bunny2.positions)},
    uniforms: Model.uniforms(regl2)
  });
  const lightDraw = regl2({
    elements: cube2.indices,
    attributes: {position: cube2.positions, normal: cube2.normals},
    uniforms: Model.uniforms(regl2)
  });
  const shadowDraw = regl2({
    frag: assets["pbr_shadow.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"},
    uniforms: {
      shadowCube: shadowFbo
    }
  });
  const plainDraw = regl2({
    frag: assets["main.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"}
  });
  const statsWidget = createStatsWidget([
    [planeDraw, "plane"],
    [bunnyDraw, "bunnies"],
    [lightDraw, "lights"]
  ]);
  regl2.frame(() => {
    const deltaTime = 0.017;
    statsWidget.update(deltaTime);
    lightScope(() => {
      drawDepth(6, () => {
        regl2.clear({depth: 1});
        bunnyDraw(bunnyProps);
        planeDraw(planeProps);
      });
    });
    regl2.clear({color: [0.05, 0.05, 0.05, 1]});
    camera2(() => {
      lightScope(() => {
        shadowDraw(() => {
          bunnyDraw(bunnyProps);
          planeDraw(planeProps);
        });
      });
      plainDraw(() => {
        lightDraw(lightProps);
      });
    });
  });
};
//# sourceMappingURL=index.js.map

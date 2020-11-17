import REGL from "../web/regl.js";
import resl2 from "../web/resl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import {glMatrix, mat4, vec3} from "../web/gl-matrix.js";
import {FPSControls} from "./lib/controls.js";
import {cube as cube2} from "./models/cube.js";
import {createStatsWidget} from "./ui/stats-widget.js";
import {Model} from "./lib/model.js";
import {Lights} from "./lib/lights.js";
import {debugLogger} from "./lib/shame.js";
import {halfFloatTextureExt, queryTimerExt, textureFloatExt} from "./lib/cap.js";
import {SpinController} from "./lib/controller.js";
import {Mesh} from "./lib/mesh.js";
import {InstancedMesh} from "./lib/instanced_mesh.js";
debugLogger();
const seed = (s) => () => {
  s = Math.sin(s) * 1e4;
  return s - Math.floor(s);
};
const rand = seed(1815);
const loading = {
  manifest: {
    "main.fsh": {type: "text", src: "shaders/main.fsh"},
    "main.vsh": {type: "text", src: "shaders/main.vsh"},
    "emissive.fsh": {type: "text", src: "shaders/emissive.fsh"},
    "pbr.fsh": {type: "text", src: "shaders/pbr.fsh"},
    "pbr_shadow.fsh": {type: "text", src: "shaders/pbr_shadow.fsh"},
    "pbr_shadow.vsh": {type: "text", src: "shaders/pbr_shadow.vsh"},
    "light_cube.fsh": {type: "text", src: "shaders/light_cube.fsh"},
    "light_cube.vsh": {type: "text", src: "shaders/light_cube.vsh"}
  },
  onProgress: (progress, message) => {
  },
  onError: (err) => {
    console.debug(err);
    console.error(err);
  },
  onDone: (assets) => {
    main(assets);
  }
};
const main = (assets) => {
  const regl2 = init();
  const cubeMesh = new Mesh(cube2.positions, cube2.indices, cube2.normals);
  const planeMesh = new Mesh(plane2.positions, plane2.indices, plane2.normals);
  const bunnyMesh = new Mesh(bunny2.positions, bunny2.cells);
  const controls2 = new FPSControls(regl2._gl.canvas);
  const camera2 = createCamera(regl2, controls2, {position: [0, 3, 10]});
  const lights2 = new Lights();
  lights2.add(true, [1, 1, 1], [-3, 3, -3, 1], 5);
  lights2.add(true, [1, 0, 0], [3, 3, 3, 1], 5);
  lights2.add(false, [0, 1, 0], [-3, 3, 3, 1], 2);
  lights2.add(false, [0, 0, 1], [3, 3, -3, 1], 4);
  const lightProps = [];
  lights2.all().forEach((light, i) => {
    if (!light.on)
      return;
    const mtrl = {albedo: light.color, metallic: 0, roughness: 0.025, ao: 1};
    lightProps.push(new Model(mtrl, xyz(light.pos), 0.05));
  });
  function lightCubeDraw(lightId) {
    const shadowFbo = lights2.shadowFBO(regl2, lightId);
    const proj = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.5, 15);
    return {
      frag: assets["light_cube.fsh"],
      vert: assets["light_cube.vsh"],
      cull: {enable: true, face: "back"},
      uniforms: {
        projectionView: (context, props, batchId) => {
          switch (batchId) {
            case 0:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights2.get(lightId).pos)), [0, -1, 0]));
            case 1:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights2.get(lightId).pos)), [0, -1, 0]));
            case 2:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights2.get(lightId).pos)), [0, 0, 1]));
            case 3:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights2.get(lightId).pos)), [0, 0, -1]));
            case 4:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights2.get(lightId).pos)), [0, -1, 0]));
            case 5:
              return mat4.mul(mat4.create(), proj, mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights2.get(lightId).pos)), [0, -1, 0]));
          }
        }
      },
      framebuffer: function(context, props, batchId) {
        return shadowFbo.faces[batchId];
      }
    };
  }
  const drawDepth = [regl2(lightCubeDraw(0)), regl2(lightCubeDraw(1)), regl2(lightCubeDraw(2)), regl2(lightCubeDraw(3))];
  const oneLightScope = [regl2(lights2.lightUniform(regl2, 0)), regl2(lights2.lightUniform(regl2, 1)), regl2(lights2.lightUniform(regl2, 2)), regl2(lights2.lightUniform(regl2, 3))];
  const shadowDraw = regl2({
    frag: assets["pbr_shadow.fsh"],
    vert: assets["pbr_shadow.vsh"],
    cull: {enable: true, face: "back"},
    uniforms: {
      "shadowCubes[0]": lights2.shadowFBO(regl2, 0),
      "shadowCubes[1]": lights2.shadowFBO(regl2, 1),
      "shadowCubes[2]": lights2.shadowFBO(regl2, 2),
      "shadowCubes[3]": lights2.shadowFBO(regl2, 3),
      ao: 1e-3
    }
  });
  const ctrl = SpinController;
  const up = [0, 1, 0];
  const scale = 0.2;
  const y = 0;
  const bunnyProps = [];
  const N = 5;
  for (let x = 0; x < N; x++) {
    for (let z = 0; z < N; z++) {
      const pos = [x * (20 / N) - 8.5, y, z * (20 / N) - 7.5];
      bunnyProps.push(new Model({albedo: [rand(), rand(), rand()], metallic: rand(), roughness: rand()}, pos, scale, -43, up, new ctrl()));
    }
  }
  const bunnies = new InstancedMesh(regl2, bunnyMesh, bunnyProps);
  const bunnyDraw = regl2(bunnies.config({}));
  const planeProps = [new Model({albedo: [0.3, 0.3, 0.3], metallic: 0.1, roughness: 0.9}, [0, 0, 0], 20)];
  const planes = new InstancedMesh(regl2, planeMesh, planeProps);
  const planeDraw = regl2(planes.config({}));
  const lightsI = new InstancedMesh(regl2, cubeMesh, lightProps);
  const lightBulbDraw = regl2(lightsI.config({}));
  const allLightScope = regl2(lights2.allUniforms(regl2));
  const emissiveDraw = regl2({
    frag: assets["emissive.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"}
  });
  const drawCalls = [];
  lights2.lights.forEach((l, i) => {
    if (l.on)
      drawCalls.push([drawDepth[i], `lightmap${i}`]);
  });
  drawCalls.push([shadowDraw, "shadowed"]);
  drawCalls.push([emissiveDraw, "emissive"]);
  const statsWidget = createStatsWidget(drawCalls, regl2);
  let prevTime = 0;
  regl2.frame(({time}) => {
    const deltaTime = time - prevTime;
    prevTime = time;
    statsWidget.update(deltaTime);
    bunnies.update();
    for (let i = 0; i < lights2.all().length; i++) {
      if (!lights2.get(i).on) {
        continue;
      }
      oneLightScope[i](() => {
        drawDepth[i](6, () => {
          regl2.clear({depth: 1});
          bunnyDraw();
          planeDraw();
        });
      });
    }
    regl2.clear({color: [0.06, 0.06, 0.06, 255], depth: 1});
    camera2(() => {
      allLightScope(() => {
        shadowDraw(() => {
          bunnyDraw();
          planeDraw();
        });
      });
      emissiveDraw(() => {
        lightBulbDraw();
      });
    });
  });
};
const xyz = (t) => vec3.fromValues(t[0], t[1], t[2]);
const init = function() {
  const requestExtensions = [];
  if (queryTimerExt()) {
    requestExtensions.push("EXT_disjoint_timer_query");
  }
  if (halfFloatTextureExt()) {
    requestExtensions.push(halfFloatTextureExt());
  }
  if (textureFloatExt()) {
    requestExtensions.push(textureFloatExt());
  }
  requestExtensions.push("oes_vertex_array_object");
  requestExtensions.push("ANGLE_instanced_arrays");
  return REGL({
    extensions: requestExtensions,
    optionalExtensions: ["oes_texture_float_linear"],
    profile: true,
    attributes: {antialias: true}
  });
};
resl2(loading);
//# sourceMappingURL=index.js.map

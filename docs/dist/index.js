import REGL from "../web/regl.js";
import resl2 from "../web/resl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import {FPSControls} from "./lib/controls.js";
import {cube as cube2} from "./models/cube.js";
import {createStatsWidget} from "./ui/stats-widget.js";
import {Model} from "./lib/model.js";
import {debugLogger} from "./lib/shame.js";
import {halfFloatTextureExt, queryTimerExt, textureFloatExt} from "./lib/cap.js";
import {SpinController} from "./lib/controller.js";
import {Mesh} from "./lib/mesh.js";
import {InstancedMesh} from "./lib/instanced_mesh.js";
import {DirectionalLight, Lights, PointLight} from "./lib/light.js";
import {xyz} from "./lib/swizzle.js";
debugLogger();
const seed = (s) => () => {
  s = Math.sin(s) * 1e4;
  return s - Math.floor(s);
};
const rand = seed(1815);
let toLoad = {
  "main.fsh": {type: "text", src: "shaders/main.fsh"},
  "main.vsh": {type: "text", src: "shaders/main.vsh"},
  "emissive.fsh": {type: "text", src: "shaders/emissive.fsh"},
  "pbr.fsh": {type: "text", src: "shaders/pbr.fsh"},
  "pbr_shadow.fsh": {type: "text", src: "shaders/pbr_shadow.fsh"},
  "pbr_shadow.vsh": {type: "text", src: "shaders/pbr_shadow.vsh"},
  "light_cube.fsh": {type: "text", src: "shaders/light_cube.fsh"},
  "light_cube.vsh": {type: "text", src: "shaders/light_cube.vsh"},
  "shadow_dir.vsh": {type: "text", src: "shaders/shadow_dir.vsh"},
  "shadow_dir.fsh": {type: "text", src: "shaders/shadow_dir.fsh"}
};
toLoad = Object.assign(toLoad);
const loading = {
  manifest: toLoad,
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
  const lights = new Lights();
  lights.push(new DirectionalLight(regl2, 6, [1, 1, 0.5], [-1, 1, 1]));
  lights.push(new PointLight(regl2, 300, [1, 1, 0.8], [-3, 2, -3], 10));
  lights.push(new PointLight(regl2, 300, [1, 0, 0], [3, 2, 3], 10));
  lights.push(new PointLight(regl2, 0, [0, 1, 0], [-3, 2, 3], 10));
  lights.push(new PointLight(regl2, 0, [0, 0, 1], [3, 2, -3], 10));
  let mainConfig = {
    vert: assets["pbr_shadow.vsh"],
    frag: assets["pbr_shadow.fsh"],
    cull: {enable: true, face: "back"},
    uniforms: {ao: 1e-3}
  };
  const pointShadowConf = {
    frag: assets["light_cube.fsh"],
    vert: assets["light_cube.vsh"],
    cull: {enable: true, face: "back"}
  };
  const pLightShadowDraws = [];
  lights.pointLightSetup(pLightShadowDraws, mainConfig, pointShadowConf);
  const dirShadowConf = {
    frag: assets["shadow_dir.fsh"],
    vert: assets["shadow_dir.vsh"],
    cull: {enable: true, face: "back"},
    uniforms: {ao: 1e-3}
  };
  const dirLightShadows = [];
  lights.dirLightSetup(dirLightShadows, mainConfig, dirShadowConf);
  const mainDraw = regl2(mainConfig);
  const ctrl = SpinController;
  const up = [0, 1, 0];
  const scale = 0.2;
  const y = 0;
  const bunnyProps = [];
  const N = 3;
  for (let x = 0; x < N; x++) {
    for (let z = 0; z < N; z++) {
      const pos = [x * (20 / N) - 6.6, y, z * (20 / N) - 6.6];
      bunnyProps.push(new Model({
        albedo: [rand(), rand(), rand()],
        metallic: rand(),
        roughness: rand()
      }, pos, scale, -43, up, new ctrl()));
    }
  }
  const bunnies = new InstancedMesh(regl2, bunnyMesh, bunnyProps);
  const bunnyDraw = regl2(bunnies.config({}));
  const planeProps = [new Model({albedo: [0.3, 0.3, 0.3], metallic: 0.1, roughness: 0.9}, [0, 0, 0], 20)];
  const planes = new InstancedMesh(regl2, planeMesh, planeProps);
  const planeDraw = regl2(planes.config({}));
  const lightProps = [];
  lights.forEach((light2, i) => {
    if (light2.on && light2 instanceof PointLight) {
      lightProps.push(new Model({albedo: light2.color, metallic: 0, roughness: 0.025}, xyz(light2.position), 0.05));
    }
  });
  const lightsI = new InstancedMesh(regl2, cubeMesh, lightProps);
  const lightBulbDraw = regl2(lightsI.config({}));
  const lightScope = regl2(lights.config());
  const emissiveDraw = regl2({
    frag: assets["emissive.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"}
  });
  const drawCalls = [];
  pLightShadowDraws.forEach((n, i) => {
    drawCalls.push([n, `drawDepth${i}`]);
  });
  drawCalls.push([mainDraw, "main"]);
  drawCalls.push([emissiveDraw, "emissive"]);
  const statsWidget = createStatsWidget(drawCalls, regl2);
  let prevTime = 0;
  regl2.frame(({time}) => {
    const deltaTime = time - prevTime;
    prevTime = time;
    statsWidget.update(deltaTime);
    bunnies.update();
    pLightShadowDraws.forEach((cmd) => {
      cmd(6, () => {
        regl2.clear({depth: 1});
        bunnyDraw();
        planeDraw();
      });
    });
    regl2.clear({color: [0.06, 0.06, 0.06, 255], depth: 1});
    camera2(() => {
      lightScope(() => {
        mainDraw(() => {
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

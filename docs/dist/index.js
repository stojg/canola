import REGL from "../web/regl.js";
import resl2 from "../web/resl.js";
import {createCamera} from "./lib/camera.js";
import bunny2 from "../web/bunny.js";
import plane2 from "./models/plane.js";
import normals from "../web/angle-normals.js";
import {glMatrix, mat4, vec3} from "../web/gl-matrix.js";
import {FPSControls} from "./lib/controls.js";
import {cube as cube2} from "./models/cube.js";
import createStatsWidget from "../web/regl-stats-widget.js";
import {Model} from "./lib/model.js";
import {Lights} from "./lib/lights.js";
import {debugLogger} from "./lib/shame.js";
import {halfFloatTextureExt, queryTimerExt, textureFloatExt} from "./lib/cap.js";
debugLogger();
const loading = {
  manifest: {
    "main.fsh": {type: "text", src: "shaders/main.fsh"},
    "main.vsh": {type: "text", src: "shaders/main.vsh"},
    "emissive.fsh": {type: "text", src: "shaders/emissive.fsh"},
    "pbr.fsh": {type: "text", src: "shaders/pbr.fsh"},
    "pbr_shadow.fsh": {type: "text", src: "shaders/pbr_shadow.fsh"},
    "light_cube.fsh": {type: "text", src: "shaders/light_cube.fsh"}
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
  const controls2 = new FPSControls(regl2._gl.canvas);
  const camera2 = createCamera(regl2, controls2, {position: [0, 3, 10]});
  const lights2 = new Lights();
  lights2.add(true, [10, 10, 10], [-3, 3, -3, 1]);
  lights2.add(true, [10, 0, 0], [3, 3, 3, 1]);
  lights2.add(false, [0, 10, 0], [-3, 3, 3, 1]);
  lights2.add(false, [0, 0, 10], [3, 3, -3, 1]);
  const lightProps = [];
  lights2.all().forEach((light, i) => {
    if (!light.on)
      return;
    const mtrl = {albedo: light.color, metallic: 0, roughness: 0.025, ao: 1};
    lightProps.push(new Model(mtrl, xyz(light.pos), 0.05));
  });
  function lightCubeDraw(lightId) {
    const shadowFbo = lights2.shadowFBO(regl2, lightId);
    return {
      frag: assets["light_cube.fsh"],
      vert: assets["main.vsh"],
      cull: {enable: true, face: "back"},
      uniforms: {
        projection: mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1, 0.25, 30),
        view: function(context, props, batchId) {
          switch (batchId) {
            case 0:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(1, 0, 0), xyz(lights2.get(lightId).pos)), [0, -1, 0]);
            case 1:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(-1, 0, 0), xyz(lights2.get(lightId).pos)), [0, -1, 0]);
            case 2:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 1, 0), xyz(lights2.get(lightId).pos)), [0, 0, 1]);
            case 3:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, -1, 0), xyz(lights2.get(lightId).pos)), [0, 0, -1]);
            case 4:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, 1), xyz(lights2.get(lightId).pos)), [0, -1, 0]);
            case 5:
              return mat4.lookAt(mat4.create(), xyz(lights2.get(lightId).pos), vec3.add(vec3.create(), vec3.fromValues(0, 0, -1), xyz(lights2.get(lightId).pos)), [0, -1, 0]);
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
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"},
    uniforms: {
      "shadowCubes[0]": lights2.shadowFBO(regl2, 0),
      "shadowCubes[1]": lights2.shadowFBO(regl2, 1),
      "shadowCubes[2]": lights2.shadowFBO(regl2, 2),
      "shadowCubes[3]": lights2.shadowFBO(regl2, 3)
    }
  });
  const scale = 0.2;
  const bunnyProps = [
    new Model({albedo: [0.55, 0.55, 0.6], metallic: 0.25, roughness: 0.82, ao: 0.05}, [0, 0, 0], scale, 45),
    new Model({albedo: [0.69, 0.27, 0.2], metallic: 0.2, roughness: 0.75, ao: 0.05}, [4, 0, 4], scale, -45),
    new Model({albedo: [0, 0.5, 0], metallic: 0, roughness: 0.025, ao: 0.05}, [-4, 0, 4], scale, 90),
    new Model({albedo: [0, 0.5, 0.9], metallic: 5, roughness: 0.025, ao: 0.05}, [-2, 0, 4], scale, 35),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [-6, 0, -6], scale, 70),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [4, 0, -6], scale, 35),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [6, 0, -5], scale, -43),
    new Model({albedo: [0.5, 0.5, 0.5], metallic: 5, roughness: 0.025, ao: 0.05}, [1, 0, -4], scale, -70)
  ];
  const bunnyDraw = regl2({
    elements: bunny2.cells,
    attributes: {position: bunny2.positions, normal: normals(bunny2.cells, bunny2.positions)},
    uniforms: Model.uniforms(regl2)
  });
  const planeProps = [
    new Model({
      albedo: [0.42, 0.4, 0.38],
      metallic: 0,
      roughness: 1,
      ao: 0.05
    }, [0, 0, 0], 20, 90, [1, 0, 0])
  ];
  const planeDraw = regl2({
    elements: plane2.indices,
    attributes: {position: plane2.positions, normal: plane2.normals},
    uniforms: Model.uniforms(regl2)
  });
  const lightBulbDraw = regl2({
    elements: cube2.indices,
    attributes: {position: cube2.positions, normal: cube2.normals},
    uniforms: Model.uniforms(regl2)
  });
  const allLightScope = regl2(lights2.allUniforms(regl2));
  const plainDraw = regl2({
    frag: assets["main.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"}
  });
  const emissiveDraw = regl2({
    frag: assets["emissive.fsh"],
    vert: assets["main.vsh"],
    cull: {enable: true, face: "back"}
  });
  let statsWidget = {update: (dt) => {
  }};
  if (queryTimerExt()) {
    statsWidget = createStatsWidget([
      [drawDepth[0], "drawDepth0"],
      [drawDepth[1], "drawDepth1"],
      [drawDepth[2], "drawDepth2"],
      [drawDepth[3], "drawDepth3"],
      [planeDraw, "plane"],
      [bunnyDraw, "bunnies"],
      [lightBulbDraw, "lights"]
    ]);
  }
  regl2.frame(({tick}) => {
    const deltaTime = 0.01666666;
    statsWidget.update(deltaTime);
    for (let i = 0; i < 4; i++) {
      if (!lights2.get(i).on) {
        continue;
      }
      oneLightScope[i](() => {
        drawDepth[i](6, () => {
          regl2.clear({depth: 1, color: [1, 1, 1, 1]});
          bunnyDraw(bunnyProps);
          planeDraw(planeProps);
        });
      });
    }
    regl2.clear({color: [0.05, 0.05, 0.05, 1]});
    camera2(() => {
      allLightScope(() => {
        shadowDraw(() => {
          bunnyDraw(bunnyProps);
          planeDraw(planeProps);
        });
      });
      emissiveDraw(() => {
        lightBulbDraw(lightProps);
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
  return REGL({
    extensions: requestExtensions,
    profile: true,
    attributes: {antialias: true}
  });
};
resl2(loading);
//# sourceMappingURL=index.js.map

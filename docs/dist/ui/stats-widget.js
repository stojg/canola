import {extDisjointTimerQuery} from "../lib/cap.js";
const getReadableFileSizeString = (fileSizeInBytes) => {
  let i = -1;
  const byteUnits = [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"];
  do {
    fileSizeInBytes = fileSizeInBytes / 1024;
    i++;
  } while (fileSizeInBytes > 1024);
  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};
export function createStatsWidget(drawCalls, regl) {
  const nullOp = {update: (dt) => {
  }};
  const prevGpuTimes = [];
  const prevCpuTimes = [];
  let i;
  for (i = 0; i < drawCalls.length; i++) {
    prevGpuTimes[i] = 0;
    prevCpuTimes[i] = 0;
  }
  let totalTime = 1.1;
  const N = 50;
  const totalGpuFrameTime = [];
  const totalCpuFrameTime = [];
  let frameTimeCount = 0;
  const avgGpuFrameTime = [];
  const avgCpuFrameTime = [];
  for (i = 0; i < drawCalls.length; ++i) {
    totalGpuFrameTime[i] = 0;
    avgGpuFrameTime[i] = 0;
    totalCpuFrameTime[i] = 0;
    avgCpuFrameTime[i] = 0;
  }
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:5px;left:5px;opacity:0.8;z-index:10000;";
  const pr = Math.round(window.devicePixelRatio || 1);
  const WIDTH = 160;
  const TEXT_SIZE = 10;
  const TEXT_START = [7, 37];
  const TEXT_SPACING = 6;
  const HEADER_SIZE = 15;
  const BOTTOM_SPACING = 20;
  const HEADER_POS = [3, 3];
  const BG = "#000";
  const FG = "#ccc";
  const HEIGHT = (drawCalls.length + 17) * TEXT_SIZE + (drawCalls.length - 1) * TEXT_SPACING + TEXT_START[1] + BOTTOM_SPACING;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return nullOp;
  }
  canvas.width = WIDTH * pr;
  canvas.height = HEIGHT * pr;
  canvas.style.cssText = "width:" + WIDTH + "px;height:" + HEIGHT + "px";
  context.fillStyle = BG;
  context.fillRect(0, 0, WIDTH * pr, HEIGHT * pr);
  context.font = "bold " + HEADER_SIZE * pr + "px Helvetica,Arial,sans-serif";
  context.textBaseline = "top";
  context.fillStyle = FG;
  context.fillText("Stats", HEADER_POS[0] * pr, HEADER_POS[1] * pr);
  container.appendChild(canvas);
  document.body.appendChild(container);
  const round = (v) => Math.round(10 * v) / 10;
  return {
    update: (deltaTime) => {
      let drawCall;
      totalTime += deltaTime;
      if (totalTime > 1) {
        totalTime = 0;
        context.fillStyle = BG;
        context.fillRect(TEXT_START[0] * pr, TEXT_START[1] * pr, (WIDTH - TEXT_START[0]) * pr, (HEIGHT - TEXT_START[1]) * pr);
        context.font = "bold " + TEXT_SIZE * pr + "px Helvetica,Arial,sans-serif";
        context.fillStyle = FG;
        const textCursor = [TEXT_START[0], TEXT_START[1]];
        const println = (str) => {
          context.fillText(str, textCursor[0] * pr, textCursor[1] * pr);
          textCursor[1] += TEXT_SIZE + TEXT_SPACING;
        };
        let totalCpu = 0;
        let totalGpu = 0;
        for (let i2 = 0; i2 < drawCalls.length; i2++) {
          drawCall = drawCalls[i2];
          const gpuTime = extDisjointTimerQuery() ? round(avgGpuFrameTime[i2]) : "n/a";
          println(drawCall[1] + " : " + round(avgGpuFrameTime[i2] + avgCpuFrameTime[i2]) + "ms (" + round(avgCpuFrameTime[i2]) + " | " + gpuTime + ")");
          totalCpu += avgCpuFrameTime[i2];
          totalGpu += avgGpuFrameTime[i2];
        }
        println("total : " + round(totalGpu + totalCpu) + "ms (" + round(totalCpu) + " | " + round(totalGpu) + ")");
        println("");
        const bufferSize = regl.stats.getTotalBufferSize ? getReadableFileSizeString(regl.stats.getTotalBufferSize()) : "n/a";
        println("buffers : " + regl.stats.bufferCount + ` @ ${bufferSize}`);
        println("textures : " + regl.stats.textureCount);
        const textSize = regl.stats.getTotalTextureSize ? getReadableFileSizeString(regl.stats.getTotalTextureSize()) : "n/a";
        println("cubes : " + regl.stats.cubeCount + ` @ ${textSize}`);
        println("elements : " + regl.stats.elementsCount);
        println("framebuffers : " + regl.stats.framebufferCount);
        println("shaders : " + regl.stats.shaderCount);
        if (regl.stats.getTotalRenderbufferSize) {
          println("renderBuffers : " + getReadableFileSizeString(regl.stats.getTotalRenderbufferSize()));
        }
        if (regl.stats.getMaxUniformsCount) {
          println("max uniforms : " + regl.stats.getMaxUniformsCount());
        }
        if (regl.stats.getMaxAttributesCount) {
          println("max attributes : " + regl.stats.getMaxAttributesCount());
        }
      }
      frameTimeCount++;
      for (i = 0; i < drawCalls.length; i++) {
        drawCall = drawCalls[i];
        let gpuFrameTime = drawCall[0].stats.gpuTime - prevGpuTimes[i];
        let cpuFrameTime = drawCall[0].stats.cpuTime - prevCpuTimes[i];
        totalGpuFrameTime[i] += gpuFrameTime;
        totalCpuFrameTime[i] += cpuFrameTime;
        if (frameTimeCount === N) {
          avgGpuFrameTime[i] = totalGpuFrameTime[i] / N;
          totalGpuFrameTime[i] = 0;
          avgCpuFrameTime[i] = totalCpuFrameTime[i] / N;
          totalCpuFrameTime[i] = 0;
        }
        prevGpuTimes[i] = drawCall[0].stats.gpuTime;
        prevCpuTimes[i] = drawCall[0].stats.cpuTime;
      }
      if (frameTimeCount === N) {
        frameTimeCount = 0;
      }
    }
  };
}
//# sourceMappingURL=stats-widget.js.map

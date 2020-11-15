import REGL from "../../web/regl.js";
const supportedExtensions = [];
export function hasExtension(check) {
  if (supportedExtensions.length == 0) {
    const initialRegl = REGL({});
    const a = initialRegl._gl.getSupportedExtensions();
    initialRegl.destroy();
    if (a) {
      a.forEach((val) => {
        supportedExtensions.push(val.toUpperCase());
      });
    }
  }
  return supportedExtensions.includes(check.toUpperCase()) ? check : "";
}
export const isAppleDevice = () => /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
export const queryTimerExt = () => hasExtension("EXT_disjoint_timer_query");
export const halfFloatTextureExt = () => hasExtension("OES_texture_half_float");
export const textureFloatExt = () => {
  return isAppleDevice() ? "" : hasExtension("OES_texture_float");
};
//# sourceMappingURL=cap.js.map

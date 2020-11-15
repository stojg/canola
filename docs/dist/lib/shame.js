export function printLimits(regl) {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:20px;left:20px;opacity:0.8;z-index:-10000;";
  const dl = document.createElement("dl");
  for (const limitsKey in regl.limits) {
    const dt = document.createElement("dt");
    const a = document.createTextNode(limitsKey);
    dt.appendChild(a);
    dl.appendChild(dt);
    const dd = document.createElement("dd");
    const b = document.createTextNode(regl.limits[limitsKey]);
    dd.appendChild(b);
    dl.appendChild(dd);
  }
  container.appendChild(dl);
  document.body.appendChild(container);
}
export function debugLogger() {
  if (typeof console != "undefined") {
    if (typeof console.debug != "undefined") {
      console.olog = console.debug;
    } else {
      console.olog = () => {
      };
    }
  }
  const debugContainer = document.createElement("div");
  debugContainer.style.cssText = "position:fixed;top:2px;left:2px;opacity:1.0;background:#fff;z-index:10001;";
  document.body.appendChild(debugContainer);
  console.error = (message) => {
    console.olog(message);
    const t = document.createTextNode(message);
    const p = document.createElement("p");
    p.appendChild(t);
    debugContainer.appendChild(p);
  };
}
//# sourceMappingURL=shame.js.map

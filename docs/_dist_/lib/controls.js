import mouseChange from "../../web_modules/mouse-change.js";
import {vec2} from "../../web_modules/gl-matrix.js";
class Controls {
}
export class FPSControls extends Controls {
  constructor(canvas) {
    super();
    this._pointerLocked = false;
    this._mouseMovementX = 0;
    this._mouseMovementY = 0;
    window.addEventListener("keydown", this.onKeyDown, false);
    window.addEventListener("keyup", this.onKeyUp, false);
    this._canvas = canvas;
    this.initPointerLock();
    mouseChange((buttons, x, y, mods) => {
      if (this.pointerLocked && buttons & 2) {
        this.exitPointerlock();
      }
    });
  }
  onKeyDown(ev) {
    if (ev.key) {
      FPSControls.keysDown[ev.key] = true;
    }
  }
  onKeyUp(ev) {
    if (ev.key) {
      delete FPSControls.keysDown[ev.key];
    }
  }
  keyPressed(key) {
    return FPSControls.keysDown[key];
  }
  get pointerLocked() {
    return this._pointerLocked;
  }
  exitPointerlock() {
    document.exitPointerLock();
  }
  initPointerLock() {
    this._canvas.requestPointerLock = this._canvas.requestPointerLock || this._canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    if ("onpointerlockchange" in document) {
      document.addEventListener("pointerlockchange", this.lockChangeAlert.bind(this), false);
    } else if ("onmozpointerlockchange" in document) {
      document.addEventListener("mozpointerlockchange", this.lockChangeAlert.bind(this), false);
    }
    this._canvas.onclick = () => {
      this._canvas.requestPointerLock();
    };
  }
  lockChangeAlert() {
    this._pointerLocked = !!document.pointerLockElement || !!document.mozPointerLockElement;
    const callback = (ev) => {
      this._mouseMovementX = ev.movementX;
      this._mouseMovementY = ev.movementY;
    };
    if (this._pointerLocked) {
      document.addEventListener("mousemove", callback.bind(this), true);
    } else {
      document.removeEventListener("mousemove", callback.bind(this), true);
      this._mouseMovementX = this._mouseMovementY = 0;
    }
  }
  pointerMovement() {
    if (!this._pointerLocked) {
      return [0, 0];
    }
    const pos = vec2.fromValues(this._mouseMovementX, this._mouseMovementY);
    this._mouseMovementX = damp(this._mouseMovementX);
    this._mouseMovementY = damp(this._mouseMovementY);
    return pos;
  }
}
FPSControls.keysDown = {};
const damp = (x) => {
  const xd = x * 0.9;
  if (Math.abs(xd) < 0.1) {
    return 0;
  }
  return xd;
};
//# sourceMappingURL=controls.js.map

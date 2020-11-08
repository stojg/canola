import mouseChange from 'mouse-change';
import { vec2 } from 'gl-matrix';

class Controls {}

export interface MetaButtons {
  shift: boolean;
  alt: boolean;
  control: boolean;
  meta: boolean;
}

export class FPSControls extends Controls {
  private static keysDown: Record<string, boolean> = {};
  private _pointerLocked: boolean = false;
  private _canvas: HTMLCanvasElement;
  private _mouseMovementX: number = 0;
  private _mouseMovementY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    super();
    window.addEventListener('keydown', this.onKeyDown, false);
    window.addEventListener('keyup', this.onKeyUp, false);
    this._canvas = canvas;
    this.initPointerLock();
    mouseChange((buttons: any, x: number, y: number, mods: MetaButtons) => {
      if (this.pointerLocked && buttons & 2) {
        this.exitPointerlock();
      }
    });
  }

  onKeyDown(ev: KeyboardEvent) {
    if (ev.key) {
      FPSControls.keysDown[ev.key] = true;
    }
  }

  onKeyUp(ev: KeyboardEvent) {
    if (ev.key) {
      delete FPSControls.keysDown[ev.key];
    }
  }

  keyPressed(key: string): boolean {
    return FPSControls.keysDown[key];
  }

  get pointerLocked(): boolean {
    return this._pointerLocked;
  }

  exitPointerlock() {
    document.exitPointerLock();
  }

  private initPointerLock() {
    // @ts-ignore
    this._canvas.requestPointerLock =
      this._canvas.requestPointerLock || this._canvas.mozRequestPointerLock;
    // @ts-ignore
    document.exitPointerLock =
      document.exitPointerLock || document.mozExitPointerLock;

    if ('onpointerlockchange' in document) {
      document.addEventListener(
        'pointerlockchange',
        this.lockChangeAlert.bind(this),
        false,
      );
    } else if ('onmozpointerlockchange' in document) {
      // @ts-ignore
      document.addEventListener(
        'mozpointerlockchange',
        this.lockChangeAlert.bind(this),
        false,
      );
    }

    this._canvas.onclick = () => {
      this._canvas.requestPointerLock();
    };
  }

  lockChangeAlert() {
    // @ts-ignore
    this._pointerLocked =
      !!document.pointerLockElement || !!document.mozPointerLockElement;
    const callback = (ev: MouseEvent) => {
      this._mouseMovementX = ev.movementX;
      this._mouseMovementY = ev.movementY;
    };
    if (this._pointerLocked) {
      document.addEventListener('mousemove', callback.bind(this), true);
    } else {
      document.removeEventListener('mousemove', callback.bind(this), true);
      this._mouseMovementX = this._mouseMovementY = 0;
    }
  }

  pointerMovement(): vec2 {
    if (!this._pointerLocked) {
      return [0, 0];
    }
    const pos = vec2.fromValues(this._mouseMovementX, this._mouseMovementY);
    this._mouseMovementX = damp(this._mouseMovementX);
    this._mouseMovementY = damp(this._mouseMovementY);
    return pos;
  }
}

const damp = (x: number) => {
  const xd = x * 0.9;
  if (Math.abs(xd) < 0.1) {
    return 0;
  }
  return xd;
};

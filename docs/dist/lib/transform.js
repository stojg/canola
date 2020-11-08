import {mat4, quat, vec3} from "../../web/gl-matrix.js";
export class Transform {
  constructor(props) {
    this._transformation = mat4.create();
    this.dirty = true;
    mat4.identity(this._transformation);
    this._position = props.position || vec3.create();
    this._rotation = props.rotation || quat.create();
    this._scale = props.scale || vec3.fromValues(1, 1, 1);
  }
  get position() {
    return this._position;
  }
  set position(value) {
    this._position = value;
    this.dirty = true;
  }
  addPosition(a) {
    vec3.add(this._position, this._position, a);
    this.dirty = true;
  }
  get rotation() {
    return this._rotation;
  }
  set rotation(value) {
    this._rotation = value;
    this.dirty = true;
  }
  rotateXY(x, y) {
    const tmp = quat.create();
    quat.setAxisAngle(tmp, [0, 1, 0], x);
    quat.mul(this.rotation, tmp, this.rotation);
    quat.setAxisAngle(tmp, [1, 0, 0], y);
    quat.mul(this.rotation, this.rotation, tmp);
    this.dirty = true;
  }
  get scale() {
    return this._scale;
  }
  set scale(value) {
    this._scale = value;
    this.dirty = true;
  }
  get transformation() {
    return this._transformation;
  }
  update() {
    if (!this.dirty) {
      return;
    }
    mat4.fromRotationTranslationScale(this._transformation, this._rotation, this._position, this._scale);
    quat.normalize(this.rotation, this.rotation);
    this.dirty = false;
  }
}
//# sourceMappingURL=transform.js.map

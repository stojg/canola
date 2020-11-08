import {mat4, quat, vec3} from "gl-matrix"

export interface TransformProperties {
    position? : vec3
    rotation? : quat
    scale? : vec3
}

export class Transform {
    private _position : vec3
    private _rotation : quat
    private _scale : vec3
    private _transformation : mat4 = mat4.create()
    private dirty: boolean = true

    constructor(props : TransformProperties) {
        mat4.identity(this._transformation)
        this._position = props.position || vec3.create()
        this._rotation = props.rotation || quat.create()
        this._scale = props.scale || vec3.fromValues(1,1,1)
    }

    get position(): vec3 {
        return this._position
    }

    set position(value: vec3) {
        this._position = value
        this.dirty = true
    }

    addPosition(a : vec3) {
        vec3.add(this._position, this._position, a)
        this.dirty = true
    }

    get rotation(): quat {
        return this._rotation
    }

    set rotation(value: quat) {
        this._rotation = value
        this.dirty = true
    }

    // stable XY rotation that avoids 'creeping' roll
    rotateXY(x : number, y : number) {
        // Pitch Locally, Yaw Globally
        const tmp = quat.create()
        quat.setAxisAngle(tmp, [0,1,0], x)
        quat.mul(this.rotation, tmp, this.rotation)
        quat.setAxisAngle(tmp, [1,0,0], y)
        quat.mul(this.rotation, this.rotation, tmp)
        this.dirty = true
    }

    get scale(): vec3 {
        return this._scale
    }

    set scale(value: vec3) {
        this._scale = value
        this.dirty = true
    }

    get transformation(): mat4 {
        return this._transformation
    }

    update() {
        if (!this.dirty) {
            return
        }
        mat4.fromRotationTranslationScale(this._transformation, this._rotation, this._position, this._scale)
        quat.normalize(this.rotation, this.rotation)
        this.dirty = false
    }
}
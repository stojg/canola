import type REGL from 'regl';

const planePosition: REGL.Vec3[] = [];
planePosition.push([-0.5, 0.0, -0.5]);
planePosition.push([+0.5, 0.0, -0.5]);
planePosition.push([-0.5, 0.0, +0.5]);
planePosition.push([+0.5, 0.0, +0.5]);
const planeNormal: REGL.Vec3[] = [];
planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);

const planeElements: REGL.Vec3[] = [];
planeElements.push([3, 1, 0]);
planeElements.push([0, 2, 3]);

export default {
  positions: planePosition,
  normals: planeNormal,
  cells: planeElements,
};

const planePosition = [];
planePosition.push([-0.5, 0, -0.5]);
planePosition.push([0.5, 0, -0.5]);
planePosition.push([-0.5, 0, 0.5]);
planePosition.push([0.5, 0, 0.5]);
const planeNormal = [];
planeNormal.push([0, 1, 0]);
planeNormal.push([0, 1, 0]);
planeNormal.push([0, 1, 0]);
planeNormal.push([0, 1, 0]);
const planeElements = [];
planeElements.push([3, 1, 0]);
planeElements.push([0, 2, 3]);
export default {
  positions: planePosition,
  normals: planeNormal,
  cells: planeElements
};

let wells = [
  { x: 0, y: 0, z: 100 },
  { x: 1, y: 1, z: 90 },
  { x: -1, y: 1, z: 90 },
  { x: 1, y: -1, z: 90 },
  { x: -1, y: -1, z: 90 },
  { x: 2, y: 2, z: 80 },
  { x: -2, y: 2, z: 80 },
  { x: 2, y: -2, z: 80 },
  { x: -2, y: -2, z: 80 },
  { x: 3, y: 0, z: 70 },
  { x: -3, y: 0, z: 70 },
  { x: 0, y: 3, z: 70 },
  { x: 0, y: -3, z: 70 },
  { x: 4, y: 4, z: 60 },
  { x: -4, y: 4, z: 60 },
  { x: 4, y: -4, z: 60 },
  { x: -4, y: -4, z: 60 },
  { x: 5, y: 0, z: 50 },
  { x: -5, y: 0, z: 50 },
  { x: 0, y: 5, z: 50 },
  { x: 0, y: -5, z: 50 },
];

let x = wells.map((d) => d.x);
let y = wells.map((d) => d.y);
let z = wells.map((d) => d.z);

let model = 'spherical'; // Options: "exponential", "spherical", "gaussian"
let sigma2 = 0,
  alpha = 100;
let variogram = kriging.train(z, x, y, model, sigma2, alpha);

let xMin = Math.min(...x) - 1; // A little padding for boundary
let xMax = Math.max(...x) + 1;
let yMin = Math.min(...y) - 1; // A little padding for boundary
let yMax = Math.max(...y) + 1;

let xRange = [xMin, xMax];
let yRange = [yMin, yMax];

let gridSize = 50;

let xGrid = Array.from(
  { length: gridSize },
  (_, i) => xRange[0] + (i * (xRange[1] - xRange[0])) / gridSize
);
let yGrid = Array.from(
  { length: gridSize },
  (_, i) => yRange[0] + (i * (yRange[1] - yRange[0])) / gridSize
);
let zGrid = yGrid.map((yVal) =>
  xGrid.map((xVal) => kriging.predict(xVal, yVal, variogram))
);

// Plot Contour Map
let contourData = {
  x: xGrid,
  y: yGrid,
  z: zGrid,
  type: 'contour',
  colorscale: 'Jet',
  contours: { showlabels: true },
};

let scatterData = {
  x: x,
  y: y,
  mode: 'markers',
  marker: { color: 'black', size: 8 },
  type: 'scatter',
};

let layout = {
  title: 'Kriging Interpolated Contour Map',
  xaxis: { title: 'X Coordinate' },
  yaxis: { title: 'Y Coordinate' },
};

Plotly.newPlot('plotDiv', [contourData, scatterData], layout);

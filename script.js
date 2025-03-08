const saturationColor = [
  ['0.0', 'rgb(165,0,38)'],
  ['0.111111111111', 'rgb(215,48,39)'],
  ['0.222222222222', 'rgb(244,109,67)'],
  ['0.333333333333', 'rgb(253,174,97)'],
  ['0.444444444444', 'rgb(254,224,144)'],
  ['0.555555555556', 'rgb(224,243,248)'],
  ['0.666666666667', 'rgb(171,217,233)'],
  ['0.777777777778', 'rgb(116,173,209)'],
  ['0.888888888889', 'rgb(69,117,180)'],
  ['1.0', 'rgb(49,54,149)'],
];

const pressureColor = [
  ['0.0', 'rgb(165,0,38)'],
  ['0.111111111111', 'rgb(215,48,39)'],
  ['0.222222222222', 'rgb(244,109,67)'],
  ['0.333333333333', 'rgb(253,174,97)'],
  ['0.444444444444', 'rgb(254,224,144)'],
  ['0.555555555556', 'rgb(224,243,248)'],
  ['0.666666666667', 'rgb(171,217,233)'],
  ['0.777777777778', 'rgb(116,173,209)'],
  ['0.888888888889', 'rgb(69,117,180)'],
  ['1.0', 'rgb(49,54,149)'],
];

const depthColor = [
  ['0.0', 'rgb(165,0,38)'],
  ['0.111111111111', 'rgb(215,48,39)'],
  ['0.222222222222', 'rgb(244,109,67)'],
  ['0.333333333333', 'rgb(253,174,97)'],
  ['0.444444444444', 'rgb(254,224,144)'],
  ['0.555555555556', 'rgb(224,243,248)'],
  ['0.666666666667', 'rgb(171,217,233)'],
  ['0.777777777778', 'rgb(116,173,209)'],
  ['0.888888888889', 'rgb(69,117,180)'],
  ['1.0', 'rgb(49,54,149)'],
];

let x,
  y,
  z,
  wellNames,
  currentWorker = null,
  lastWorkerParams = null,
  cachedZGrid = null,
  gridSize = 100,
  sigma2 = 0,
  alpha = 100,
  mapType = 'contour',
  algorithm = 'kriging (spherical)',
  contour_map_color = 'saturation',
  contour_map_coloring = 'fill',
  contour_line_color = 'grey',
  contour_line_width = 0.5,
  contour_line_smoothing = 0,
  show_contour_labels = true,
  zStart = 0,
  zEnd = 100,
  zStepSize = 1,
  xMinExtend = 1000,
  xMaxExtend = 1000,
  yMinExtend = 1000,
  yMaxExtend = 1000,
  scatter_marker_color = 'black',
  scatter_marker_size = 8,
  scatter_marker_text_position = 'top left',
  scatter_marker_text_size = 12,
  scatter_marker_text_color = 'black',
  mapName = 'Iso-Map';

const map = document.getElementById('map');
const fileInput = document.getElementById('fileInput');
const gridSizeDropdown = document.getElementById('gridSizeDropdown');
const loadingIndicator = document.querySelector('.spinner');
const configurationContainer = document.querySelector('.configuration');

fileInput.addEventListener('change', function (e) {
  let file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const parsedData = XLSX.utils.sheet_to_json(worksheet);

    x = parsedData.map((i) => i.x);
    y = parsedData.map((i) => i.y);
    z = parsedData.map((i) => i.z);
    wellNames = parsedData.map((i) => i.wellNames);

    updateMap();
  };
  //
});

gridSizeDropdown.addEventListener('change', function (e) {
  gridSize = parseInt(this.value);
  updateMap();
});

function updateMap() {
  if (currentWorker) {
    currentWorker.terminate();
  }

  showLoading();

  let xMin = Math.min(...x) - xMinExtend;
  let xMax = Math.max(...x) + xMaxExtend;
  let yMin = Math.min(...y) - yMinExtend;
  let yMax = Math.max(...y) + yMaxExtend;

  let xRange = [xMin, xMax];
  let yRange = [yMin, yMax];

  let xGrid = Array.from(
    { length: gridSize },
    (_, i) => xRange[0] + (i * (xRange[1] - xRange[0])) / gridSize
  );
  let yGrid = Array.from(
    { length: gridSize },
    (_, i) => yRange[0] + (i * (yRange[1] - yRange[0])) / gridSize
  );

  let currentWorkerParams = { xGrid, yGrid, algorithm, sigma2, alpha, x, y, z };

  if (
    lastWorkerParams &&
    JSON.stringify(lastWorkerParams) == JSON.stringify(currentWorkerParams)
  ) {
    drawMap(cachedZGrid, xGrid, yGrid);
    configurationContainer.style.display = 'block';
    return;
  }

  lastWorkerParams = currentWorkerParams;

  currentWorker = new Worker('webworker.js');
  currentWorker.postMessage(currentWorkerParams);

  currentWorker.onmessage = function (e) {
    cachedZGrid = e.data.zGrid;
    hideLoading();
    drawMap(cachedZGrid, xGrid, yGrid);
    configurationContainer.style.display = 'block';
  };
}

function drawMap(zGrid, xGrid, yGrid) {
  let mapData = {
    type: mapType == 'contour' ? 'contour' : 'heatmap',
    x: xGrid,
    y: yGrid,
    z: zGrid,
    hoverinfo: 'z',
    colorscale:
      contour_map_color == 'saturation'
        ? saturationColor
        : contour_map_color == 'pressure'
        ? pressureColor
        : depthColor,
    contours: {
      coloring: contour_map_coloring,
      showlabels: show_contour_labels,
      start: zStart,
      end: zEnd,
      size: zStepSize,
    },
    line: {
      color: contour_line_color,
      width: contour_line_width,
      smoothing: contour_line_smoothing,
    },
    zmin: zStart,
    zmax: zEnd,
  };

  let scatterData = {
    x: x,
    y: y,
    mode: 'markers+text',
    type: 'scatter',
    marker: { color: scatter_marker_color, size: scatter_marker_size },
    text: wellNames,
    textposition: scatter_marker_text_position,
    textfont: {
      size: scatter_marker_text_size,
      color: scatter_marker_text_color,
    },
  };

  let layout = {
    title: {
      text: mapName,
      font: { size: 18, color: 'black' },
    },
    xaxis: {
      visible: true,
      tickformat: '.0f',
      range: [Math.min(...x) - xMinExtend, Math.max(...x) + xMaxExtend],
    },
    yaxis: {
      visible: true,
      tickformat: '.0f',
      range: [Math.min(...y) - yMinExtend, Math.max(...y) + yMaxExtend],
    },
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: [
      'pan2d',
      'select2d',
      'lasso2d',
      'zoom2d',
      'autoScale2d',
    ],
    modeBarButtons: [['zoomIn2d', 'zoomOut2d', 'resetScale2d', 'toImage']],
    responsive: true,
  };

  Plotly.newPlot(map, [mapData, scatterData], layout, config);
}

function showLoading() {
  console.log('Showing loading spinner...');
  map.style.display = 'none';
  loadingIndicator.style.display = 'block';
}

function hideLoading() {
  console.log('Hiding loading spinner...');
  map.style.display = 'block';
  loadingIndicator.style.display = 'none';
}

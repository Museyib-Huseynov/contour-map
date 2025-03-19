const map = document.getElementById('map');
const fileInput = document.getElementById('fileInput');
const loadingIndicator = document.querySelector('.spinner');
const configurationContainer = document.querySelector('.settings');
const gridSizeDropdown = document.getElementById('gridSizeDropdown');

const saturationColor = [
  ['0.0', 'rgb(165,0,38)'],
  ['0.3', 'rgb(253,174,97)'],
  ['0.4', 'rgb(224,243,248)'],
  ['0.6', 'rgb(69,117,180)'],
  ['1.0', 'rgb(0,0,128)'],
];

const pressureColor = [
  ['0.0', 'rgb(0,0,128)'],
  ['0.3', 'rgb(69,117,180)'],
  ['0.5', 'rgb(224,243,248)'],
  ['0.75', 'rgb(253,174,97)'],
  ['1.0', 'rgb(165,0,38)'],
];

const depthColor = [
  ['0.0', 'rgb(255,255,178)'],
  ['0.3', 'rgb(189,220,175)'],
  ['0.5', 'rgb(116,173,209)'],
  ['0.75', 'rgb(49,117,180)'],
  ['1.0', 'rgb(0,0,128)'],
];

let x,
  y,
  z,
  wellNames,
  algorithm = 'IDW',
  kriging_model = 'spherical',
  sigma2 = 0,
  alpha = 100,
  idwPower = 2,
  currentWorker = null,
  lastWorkerParams = null,
  isWorkerCompleted = false,
  gridSize = 100,
  cachedXGrid = null,
  cachedYGrid = null,
  cachedZGrid = null,
  mapType = 'contour',
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

    calculateMap();
  };
  //
});

document.querySelectorAll('input[name="mapType"]').forEach((radio) => {
  radio.addEventListener('change', function () {
    mapType = this.value;
    calculateMap();
  });
});

gridSizeDropdown.addEventListener('change', function (e) {
  gridSize = parseInt(this.value);
  calculateMap();
});

contourMapColorDropdown.addEventListener('change', function (e) {
  contour_map_color = this.value;
  calculateMap();
});

async function calculateMap() {
  if (currentWorker) {
    currentWorker.terminate();
  }

  showLoading();

  await new Promise((resolve) => setTimeout(resolve, 0));

  let currentWorkerParams = {
    x,
    y,
    z,
    gridSize,
    algorithm,
    kriging_model,
    sigma2,
    alpha,
    idwPower,
    xMinExtend,
    xMaxExtend,
    yMinExtend,
    yMaxExtend,
  };

  if (
    lastWorkerParams &&
    JSON.stringify(lastWorkerParams) == JSON.stringify(currentWorkerParams) &&
    isWorkerCompleted
  ) {
    hideLoading();
    drawMap(cachedZGrid, cachedXGrid, cachedYGrid);
    return;
  }

  lastWorkerParams = currentWorkerParams;

  isWorkerCompleted = false;
  currentWorker = new Worker('webworker.js');
  currentWorker.postMessage(currentWorkerParams);

  currentWorker.onmessage = function (e) {
    cachedXGrid = e.data.xGrid;
    cachedYGrid = e.data.yGrid;
    cachedZGrid = e.data.zGrid;
    isWorkerCompleted = true;
    hideLoading();
    drawMap(cachedZGrid, cachedXGrid, cachedYGrid);
    configurationContainer.style.display = 'grid';
  };
}

function drawMap(zGrid, xGrid, yGrid) {
  let mapData = {
    type: mapType == 'contour' ? 'contour' : 'heatmap',
    x: xGrid,
    y: yGrid,
    z: zGrid,
    hoverinfo: 'x+y+z',
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
    modeBarButtons: [
      ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'pan2d', 'resetScale2d', 'toImage'],
    ],
    responsive: true,
  };

  Plotly.newPlot(map, [mapData, scatterData], layout, config);
}

function showLoading() {
  map.style.display = 'none';
  loadingIndicator.style.display = 'block';
}

function hideLoading() {
  map.style.display = 'block';
  loadingIndicator.style.display = 'none';
}

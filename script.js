const map = document.getElementById('map');
const fileInput = document.getElementById('fileInput');
const loadingIndicator = document.querySelector('.spinner');
const configurationContainer = document.querySelector('.settings');
const gridSizeDropdown = document.getElementById('gridSizeDropdown');
const mapColorDropdown = document.getElementById('mapColorDropdown');
const contourMapColoringDropdown = document.getElementById(
  'contourMapColoringDropdown'
);
const showLabelsCheckbox = document.getElementById('showLabelsCheckbox');
const showLinesCheckbox = document.getElementById('showLinesCheckbox');
const zMinLimit = document.getElementById('zMinLimit');
const zMaxLimit = document.getElementById('zMaxLimit');
const zStep = document.getElementById('zStep');
const contourLineColor = document.getElementById('contourLineColor');
const contourLineWidthDropdown = document.getElementById(
  'contourLineWidthDropdown'
);
const smoothing = document.getElementById('smoothing');
const smoothingValue = document.getElementById('smoothingValue');
const labelColor = document.getElementById('labelColor');
const labelFontSizeDropdown = document.getElementById('labelFontSizeDropdown');
const algorithmDropdown = document.getElementById('algorithmDropdown');
const krigingModelDropdown = document.getElementById('krigingModelDropdown');
const errorVariance = document.getElementById('errorVariance');
const spatialRange = document.getElementById('spatialRange');
const spatialRangeValue = document.getElementById('spatialRangeValue');
const markerSize = document.getElementById('markerSize');
const markerColor = document.getElementById('markerColor');
const reset = document.getElementById('reset');
const idwPow = document.getElementById('idwPow');

zStep.value = 1;

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
  algorithm = 'kriging',
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
  map_color = 'saturation',
  contour_map_coloring = 'fill',
  show_contour_lines = true,
  contour_line_color = '#808080',
  contour_line_width = 0.5,
  contour_line_smoothing = 0,
  show_contour_labels = true,
  contour_label_color = '#808080',
  contour_label_font_size = 14,
  zStart,
  zEnd,
  zStepSize = 1,
  xMinExtend = 1000,
  xMaxExtend = 1000,
  yMinExtend = 1000,
  yMaxExtend = 1000,
  scatter_marker_color = 'black',
  scatter_marker_size = 12,
  scatter_marker_text_position = 'top left',
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

    zStart = Math.min(...z);
    zEnd = Math.max(...z);

    calculateMap();
  };
  //
});

document.querySelectorAll('input[name="mapType"]').forEach((radio) => {
  radio.addEventListener('change', function () {
    mapType = this.value;
    if (mapType == 'heatmap') {
      document.querySelector('.settings-right').style.display = 'none';
    } else {
      document.querySelector('.settings-right').style.display = 'block';
    }
    calculateMap();
  });
});

algorithmDropdown.addEventListener('change', function (e) {
  algorithm = this.value;
  if (algorithm == 'kriging') {
    document.querySelector('.krigingModel-container').style.display = 'block';
    document.querySelector('.errorVariance-container').style.display = 'block';
    document.querySelector('.spatialRange-container').style.display = 'block';
  } else {
    document.querySelector('.krigingModel-container').style.display = 'none';
    document.querySelector('.errorVariance-container').style.display = 'none';
    document.querySelector('.spatialRange-container').style.display = 'none';
  }
  if (algorithm == 'IDW') {
    document.querySelector('.idwPow-container').style.display = 'block';
  } else {
    document.querySelector('.idwPow-container').style.display = 'none';
  }
  calculateMap();
});

idwPow.addEventListener('change', function (e) {
  idwPower = this.value;
  calculateMap();
});

krigingModelDropdown.addEventListener('change', function (e) {
  kriging_model = this.value;
  calculateMap();
});

errorVariance.addEventListener('change', function (e) {
  this.value = Math.min(10, Math.max(0, parseFloat(this.value) || 0));
  sigma2 = parseFloat(this.value);
  calculateMap();
});

spatialRange.addEventListener('change', function (e) {
  alpha = parseInt(this.value);
  spatialRangeValue.innerText = alpha;
  calculateMap();
});

gridSizeDropdown.addEventListener('change', function (e) {
  gridSize = parseInt(this.value);
  calculateMap();
});

mapColorDropdown.addEventListener('change', function (e) {
  map_color = this.value;
  calculateMap();
});

contourMapColoringDropdown.addEventListener('change', function (e) {
  contour_map_coloring = this.value;
  if (contour_map_coloring == 'fill') {
    document.querySelector('.showLines-container').style.display = 'block';
    showLinesCheckbox.checked = true;
    show_contour_lines = true;
  } else {
    document.querySelector('.showLines-container').style.display = 'none';
  }
  if (contour_map_coloring == 'lines') {
    document.querySelector('.contourLineColor-container').style.display =
      'none';
    document.querySelector('.contourLineWidth-container').style.display =
      'block';
  } else {
    document.querySelector('.contourLineColor-container').style.display =
      'block';
    document.querySelector('.contourLineWidth-container').style.display =
      'block';
  }
  calculateMap();
});

showLinesCheckbox.addEventListener('change', function (e) {
  show_contour_lines = this.checked;
  if (show_contour_lines == false) {
    document.querySelector('.contourLineColor-container').style.display =
      'none';
    document.querySelector('.contourLineWidth-container').style.display =
      'none';
  } else {
    document.querySelector('.contourLineColor-container').style.display =
      'block';
    document.querySelector('.contourLineWidth-container').style.display =
      'block';
  }
  calculateMap();
});

showLabelsCheckbox.addEventListener('change', function (e) {
  show_contour_labels = this.checked;
  if (show_contour_labels == false) {
    document.querySelector('.labelColor-container').style.display = 'none';
    document.querySelector('.labelFontSize-container').style.display = 'none';
  } else {
    document.querySelector('.labelColor-container').style.display = 'block';
    document.querySelector('.labelFontSize-container').style.display = 'block';
  }
  calculateMap();
});

zMinLimit.addEventListener('change', function (e) {
  zStart = this.value;
  calculateMap();
});

zMaxLimit.addEventListener('change', function (e) {
  zEnd = this.value;
  calculateMap();
});

markerSize.addEventListener('change', function (e) {
  scatter_marker_size = this.value;
  calculateMap();
});

markerColor.addEventListener('change', function (e) {
  scatter_marker_color = this.value;
  calculateMap();
});

reset.addEventListener('click', function (e) {
  algorithm = 'kriging';
  kriging_model = 'spherical';
  sigma2 = 0;
  alpha = 100;
  idwPower = 2;
  gridSize = 100;
  mapType = 'contour';
  map_color = 'saturation';
  contour_map_coloring = 'fill';
  show_contour_lines = true;
  contour_line_color = '#808080';
  contour_line_width = 0.5;
  contour_line_smoothing = 0;
  show_contour_labels = true;
  contour_label_color = '#808080';
  contour_label_font_size = 14;
  zStart = Math.min(...z);
  zEnd = Math.max(...z);
  zStepSize = 1;
  xMinExtend = 1000;
  xMaxExtend = 1000;
  yMinExtend = 1000;
  yMaxExtend = 1000;
  scatter_marker_color = 'black';
  scatter_marker_size = 12;
  scatter_marker_text_position = 'top left';
  mapName = 'Iso-Map';
  calculateMap();
});

zStep.addEventListener('change', function (e) {
  zStepSize = parseFloat(this.value);
  calculateMap();
});

contourLineColor.addEventListener('change', function (e) {
  contour_line_color = this.value;
  calculateMap();
});

contourLineWidthDropdown.addEventListener('change', function (e) {
  contour_line_width = this.value;
  calculateMap();
});

smoothing.addEventListener('change', function (e) {
  contour_line_smoothing = this.value;
  smoothingValue.innerText = contour_line_smoothing;
  calculateMap();
});

labelColor.addEventListener('change', function (e) {
  contour_label_color = this.value;
  calculateMap();
});

labelFontSizeDropdown.addEventListener('change', function (e) {
  contour_label_font_size = this.value;
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
    zMinLimit.value = zStart.toFixed(1);
    zMaxLimit.value = zEnd.toFixed(1);
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
      map_color == 'saturation'
        ? saturationColor
        : map_color == 'pressure'
        ? pressureColor
        : depthColor,
    contours: {
      coloring: contour_map_coloring,
      showlines: show_contour_lines,
      showlabels: show_contour_labels,
      labelfont: {
        color: contour_label_color,
        size: contour_label_font_size,
      },
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
    showlegend: false,
  };

  let scatterData = {
    x: x,
    y: y,
    hoverinfo: 'skip',
    mode: 'markers+text',
    type: 'scatter',
    marker: {
      color: scatter_marker_color,
      size: scatter_marker_size,
    },
    text: wellNames,
    textposition: scatter_marker_text_position,
    textfont: {
      size: scatter_marker_size,
      color: scatter_marker_color,
    },
    showlegend: false,
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

  Plotly.react(map, [mapData, scatterData], layout, config);
}

function showLoading() {
  map.style.display = 'none';
  loadingIndicator.style.display = 'block';
}

function hideLoading() {
  loadingIndicator.style.display = 'none';
  map.style.display = 'block';
}

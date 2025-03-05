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
  gridSize = 100,
  sigma2 = 0,
  alpha = 100,
  mapType = 'contour',
  algorithm = 'kriging (spherical)',
  color = 'saturation',
  contour_coloring = 'fill',
  show_contour_labels = true,
  zStart = 0,
  zEnd = 100,
  zStepSize = 4;

const fileInput = document.getElementById('fileInput');
const gridSizeDropdown = document.getElementById('gridSizeDropdown');

fileInput.addEventListener('change', function (e) {
  let file = e.target.files[0];
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const parsedData = XLSX.utils.sheet_to_json(worksheet);
    console.log(parsedData);
    x = parsedData.map((i) => i.x);
    y = parsedData.map((i) => i.y);
    z = parsedData.map((i) => i.z);
    wellNames = parsedData.map((i) => i.wellNames);

    let model = 'spherical'; // Options: "exponential", "spherical", "gaussian"
    let variogram = kriging.train(z, x, y, model, sigma2, alpha);

    let xMin = Math.min(...x) - 1;
    let xMax = Math.max(...x) + 1;
    let yMin = Math.min(...y) - 1;
    let yMax = Math.max(...y) + 1;

    let xRange = [xMin, xMax];
    let yRange = [yMin, yMax];

    let gridSize = 100;

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

    let contourData = {
      x: xGrid,
      y: yGrid,
      z: zGrid,
      type: 'contour',
      colorscale: [
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
      ],
      contours: {
        coloring: 'fill',
        showlabels: true,
        labelfont: {
          size: 12, // Adjust label size
          color: 'black',
        },
        start: 0,
        end: 100,
        size: 3,
      },
      line: {
        width: '1',
        smoothing: 1,
      },
      zmin: 0,
      zmax: 100,
    };

    let scatterData = {
      x: x,
      y: y,
      mode: 'markers+text',
      type: 'scatter',
      marker: { color: 'black', size: 8 },
      text: wellNames, // Display well names
      textposition: 'top left',
      textfont: { size: 10, color: 'red' },
    };

    let layout = {
      title: {
        text: 'Isomap',
        font: { size: 18, color: 'black' },
      },
      xaxis: {
        visible: false,
        // title: { text: 'X', font: { size: 14, color: 'black' } },
      },
      yaxis: {
        visible: false,
        // title: { text: 'Y', font: { size: 14, color: 'black' } },
      },
    };

    Plotly.newPlot('contourMap', [contourData, scatterData], layout);
  };
  //
});

gridSizeDropdown.addEventListener('change', function (e) {
  gridSize = parseInt(this.value);
  console.log(gridSize);
});

function kriging_method(model) {
  let variogram = kriging.train(z, x, y, model, sigma2, alpha);
  return yGrid.map((yVal) =>
    xGrid.map((xVal) => kriging.predict(xVal, yVal, variogram))
  );
}

function updateMap(fn) {
  let xMin = Math.min(...x) - 1;
  let xMax = Math.max(...x) + 1;
  let yMin = Math.min(...y) - 1;
  let yMax = Math.max(...y) + 1;

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
  let zGrid;

  if (algorithm == 'kriging (exponential)') {
    zGrid = kriging_method('exponential');
  } else if (algorithm == 'kriging (spherical)') {
    zGrid = kriging_method('exponential');
  } else if (algorithm == 'kriging (gaussian)') {
    zGrid = kriging_method('gaussian');
  }

  let contourData = {
    x: xGrid,
    y: yGrid,
    z: zGrid,
    type: mapType,
    colorscale:
      color == 'saturation'
        ? saturationColor
        : color == 'pressure'
        ? pressureColor
        : depthColor,
    contours: {
      coloring: contour_coloring,
      showlabels: show_contour_labels,
      start: zStart,
      end: zEnd,
      size: zStepSize,
    },
  };
}

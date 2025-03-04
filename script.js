let x, y, z, wellNames;

const fileInputTag = document.getElementById('fileInput');

fileInputTag.addEventListener('change', function (e) {
  let file = e.target.files[0];
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

    let model = 'spherical'; // Options: "exponential", "spherical", "gaussian"
    let sigma2 = 0,
      alpha = 100;
    let variogram = kriging.train(z, x, y, model, sigma2, alpha);

    let xMin = Math.min(...x) - 1;
    let xMax = Math.max(...x) + 1;
    let yMin = Math.min(...y) - 1;
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
      contours: { showlabels: true, start: 0, end: 100, size: 4 },
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

// let wells = [
//   { x: 0, y: 0, z: 50, name: 'GUN 1' },
//   { x: 1, y: 1, z: 50, name: 'GUN 2' },
//   { x: -1, y: 1, z: 50, name: 'GUN 3' },
//   { x: 1, y: -1, z: 50, name: 'GUN 4' },
//   { x: -1, y: -1, z: 60, name: 'GUN 5' },
//   { x: 2, y: 2, z: 60, name: 'GUN 6' },
//   { x: -2, y: 2, z: 60, name: 'GUN 7' },
//   { x: 2, y: -2, z: 60, name: 'GUN 8' },
//   { x: -2, y: -2, z: 70, name: 'GUN 9' },
//   { x: 3, y: 0, z: 70, name: 'GUN 10' },
//   { x: -3, y: 0, z: 70, name: 'GUN 11' },
//   { x: 0, y: 3, z: 70, name: 'GUN 12' },
//   { x: 0, y: -3, z: 80, name: 'GUN 13' },
//   { x: 4, y: 4, z: 80, name: 'GUN 14' },
//   { x: -4, y: 4, z: 80, name: 'GUN 15' },
//   { x: 4, y: -4, z: 80, name: 'GUN 16' },
//   { x: -4, y: -4, z: 90, name: 'GUN 17' },
//   { x: 5, y: 0, z: 90, name: 'GUN 18' },
//   { x: -5, y: 0, z: 90, name: 'GUN 19' },
//   { x: 0, y: 5, z: 90, name: 'GUN 20' },
//   { x: 0, y: -5, z: 100, name: 'GUN 21' },
// ];

// let x = wells.map((d) => d.x);
// let y = wells.map((d) => d.y);
// let z = wells.map((d) => d.z);
// let names = wells.map((d) => d.name);

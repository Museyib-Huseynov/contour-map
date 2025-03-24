self.onmessage = function (e) {
  const {
    x,
    y,
    z,
    gridSize,
    algorithm,
    kriging_model,
    sigma2,
    alpha,
    idwPower,
    xMin,
    xMax,
    yMin,
    yMax,
  } = e.data;

  importScripts('https://unpkg.com/@sakitam-gis/kriging/dist/kriging.js');

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
  if (algorithm == 'kriging') {
    zGrid = yGrid.map((yVal) =>
      xGrid.map((xVal) => {
        return kriging_method(kriging_model, xVal, yVal);
      })
    );
  } else if (algorithm == 'IDW') {
    zGrid = inverseDistanceWeighting(xGrid, yGrid, x, y, z, idwPower);
  }

  self.postMessage({ xGrid, yGrid, zGrid });

  function kriging_method(model, xValue, yValue) {
    let variogram = kriging.train(z, x, y, model, sigma2, alpha);
    return kriging.predict(xValue, yValue, variogram);
  }

  function inverseDistanceWeighting(xGrid, yGrid, x, y, z, power) {
    return yGrid.map((yVal) =>
      xGrid.map((xVal) => {
        let numerator = 0;
        let denominator = 0;
        let exactMatch = false;
        for (let i = 0; i < x.length; i++) {
          const dx = x[i] - xVal;
          const dy = y[i] - yVal;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared === 0) {
            exactMatch = true;
            return z[i];
          }
          const weight = 1 / Math.pow(distanceSquared, power / 2);
          numerator += weight * z[i];
          denominator += weight;
        }
        return exactMatch ? undefined : numerator / denominator;
      })
    );
  }
};

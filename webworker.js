self.onmessage = function (e) {
  console.log('web worker run...');
  const { xGrid, yGrid, algorithm, sigma2, alpha, x, y, z } = e.data;

  importScripts('https://unpkg.com/@sakitam-gis/kriging/dist/kriging.js');

  function kriging_method(model, xValue, yValue) {
    let variogram = kriging.train(z, x, y, model, sigma2, alpha);
    return kriging.predict(xValue, yValue, variogram);
  }

  let zGrid = yGrid.map((yVal) =>
    xGrid.map((xVal) => {
      if (algorithm === 'kriging (exponential)') {
        return kriging_method('exponential', xVal, yVal);
      } else if (algorithm === 'kriging (spherical)') {
        return kriging_method('spherical', xVal, yVal);
      } else if (algorithm === 'kriging (gaussian)') {
        return kriging_method('gaussian', xVal, yVal);
      }
    })
  );

  self.postMessage({ zGrid });
};

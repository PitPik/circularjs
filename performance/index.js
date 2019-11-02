require(['circular'], ({ Component }) => {

return Component({
  selector: 'body',
  template: document.body.innerHTML,
  subscribe$: {
    model: ['value', 'max'],
    this: ['levelRaster', 'levelSpeed', 'refresh', 'raster'],
  }
}, class Speed {
  levelRaster = 10;
  levelSpeed = 400;
  refresh;
  raster;
  model = initModel(10, []);

  constructor() {
    document.body.firstElementChild.innerHTML = '';
  }

  onInit() {
    this.levelRaster = 10;
    this.levelSpeed = 400;
  }

  this$(propName, item, value) {
    if (propName === 'levelRaster') {
      this.model = initModel(value, []);
      this.levelSpeed = this.levelSpeed;
      this.raster = 
        value + ' x ' + value + ' = ' + (value * value) + ' x 2 items';
      update(this.model, this.levelSpeed);
    } else if (propName === 'levelSpeed') {
      this.refresh = 
        value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s): ' +
        (Math.round(this.levelRaster * this.levelRaster *
        (1000 / value) * 2) + '').replace(/(\d+)(\d{3})$/g, "$1.$2") + ' updates/s';
      update(this.model, this.levelSpeed);
    }
  }

  changeRaster(e, elm, item) {
    this.levelRaster = elm.value;
  }

  changeSpeed(e, elm, item) {
    this.levelSpeed = elm.value;
  }
}).init(document.body.firstElementChild);

function initModel(raster, data) {
  for (var n = raster, newData = 0; n--; ) {
    data[n] = { childNodes : [] };
    for (var m = raster; m--; ) {
      newData = Math.round(Math.random() * 1000) % 100;
      data[n].childNodes.push({ value: newData, max: newData > 90 ? 'max' : '' });
    }
  }
  return data;
}

function update(model, levelSpeed) {
  clearTimeout(model._timeout);
  model._timeout = setTimeout(function render() {
    // window.requestAnimationFrame(function() {
      for (var n = 0, m = model.length, newData = 0; n < m; n++) {
        for (var x = 0, y = model[n].childNodes.length; x < y; x++) {
          newData = Math.round(Math.random() * 1000) % 100;
          
          model[n].childNodes[x].value = newData;
          model[n].childNodes[x].max = newData > 90 ? 'max' : '';
        }
      }
      update(model, levelSpeed);
    // })
  }, levelSpeed);
}

});
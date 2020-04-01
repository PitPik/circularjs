require(['circular'], ({ Component }) => {

return Component({
  selector: 'body',
  template: document.body.innerHTML,
  subscribe$: {
    model: ['value', 'max'],
    this: ['levelRaster', 'levelSpeed', 'refresh', 'raster'],
  }
}, class Speed {
  constructor() {
    this.levelRaster = 10;
    this.levelSpeed = 400;
    this.refresh = null;
    this.raster = null;
    this.model = initModel(10, []);

    this.perfMonitor = perfMonitor;
    this.perfMonitor.startFPSMonitor();
    this.perfMonitor.startMemMonitor();
    this.perfMonitor.initProfiler("render");

    document.body.firstElementChild.innerHTML = '';
  }

  onInit() {
    this.levelRaster = this.levelRaster;
  }

  this$(propName, item, value) {
    if (propName === 'levelRaster') {
      this.model = initModel(value, []);
      this.levelSpeed = this.levelSpeed;
      this.raster = value + ' x ' + value + ' = ' + (value * value) + ' x 2 items';
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
  clearTimeout(update.timeout);
  update.timeout = setTimeout(function render(_this) {
    _this.perfMonitor.startProfile("render");
    for (var n = 0, m = model.length, newData = 0; n < m; n++) {
      for (var x = 0, y = model[n].childNodes.length; x < y; x++) {
        newData = Math.round(Math.random() * 1000) % 100;
        
        model[n].childNodes[x].value = newData;
        model[n].childNodes[x].max = newData > 90 ? 'max' : '';
      }
    }
    _this.perfMonitor.endProfile("render");
    update(model, levelSpeed);
  }, levelSpeed, this);
}

});
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

    this._update = update.bind(this);

    // this.perfMonitor = perfMonitor;
    // this.perfMonitor.startFPSMonitor();
    // this.perfMonitor.startMemMonitor();
    // this.perfMonitor.initProfiler("render");


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
      clearTimeout(update.timeout);
      this._update();
    } else if (propName === 'levelSpeed') {
      this.refresh = 
        value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s): ' +
        (Math.round(this.levelRaster * this.levelRaster *
        (1000 / value) * 2) + '').replace(/(\d+)(\d{3})$/g, "$1.$2") + ' updates/s';
      clearTimeout(update.timeout);
      this._update();
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

function update() {
  update.timeout = setTimeout(this._update, this.levelSpeed);

  // this.perfMonitor.startProfile("render");
  for (var n = 0, m = this.model.length, newData = 0; n < m; n++) {
    for (var x = 0, y = this.model[n].childNodes.length, child = {}; x < y; x++) {
      child = this.model[n].childNodes[x];
      newData = Math.round(Math.random() * 1000) % 100;
      
      child.value = newData;
      child.max = newData > 90 ? 'max' : '';
    }
  }
  // this.perfMonitor.endProfile("render");
}

});
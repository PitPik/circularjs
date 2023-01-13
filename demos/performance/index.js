require(['circular'], ({ App }) =>

App({
  selector: 'app',
  template: '{{>@content}}',
  subscribe$: { this: ['levelRaster', 'levelSpeed'], 'model:childNodes': [] }
},
class Speed {
  constructor() {
    this.levelRaster = 10;
    this.levelSpeed = 500;
    this.refresh = null;
    this.raster = null;
    this.model = this.initModel(10, []);

    this._update = this.update.bind(this);
    this.timeout = 0;

    this.perfMonitor = perfMonitor;
    this.perfMonitor.startFPSMonitor();
    this.perfMonitor.startMemMonitor();
    this.perfMonitor.initProfiler("render");
  }

  onInit() {
    this.levelRaster = this.levelRaster;
  }

  this$(propName, item, value) {
    if (propName === 'levelRaster') {
      this.model = this.initModel(value, []);
      this.levelSpeed = this.levelSpeed;
      this.raster = value + ' x ' + value + ' = ' + (value * value) + ' x 2 items';
      clearTimeout(this.timeout);
      this._update();
    } else if (propName === 'levelSpeed') {
      this.refresh = 
        value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s): ' +
        (Math.round(this.levelRaster * this.levelRaster *
        (1000 / value) * 2) + '').replace(/(\d+)(\d{3})$/g, "$1.$2") + ' updates/s';
      clearTimeout(this.timeout);
      this._update();
    }
  }

  changeRaster(e, elm, item) {
    this.levelRaster = elm.value;
  }

  changeSpeed(e, elm, item) {
    this.levelSpeed = elm.value;
  }

  initModel(raster, data) {
    for (var n = raster, newData = 0; n--; ) {
      data[n] = { childNodes : [] };
      for (var m = raster; m--; ) {
        newData = Math.round(Math.random() * 1000) % 100;
        data[n].childNodes.push({ value: newData, max: newData > 90 ? 'max' : '' });
      }
    }
    return data;
  }

  update() {
    var n = this.model.length, x = 0, newData = 0;
    var row = this.model[0];
    var child = row.childNodes[0];

    this.perfMonitor.startProfile("render");

    for ( ; n--; ) {
      for (row = this.model[n], x = row.childNodes.length; x--; ) {
        child = row.childNodes[x];
        newData = Math.round(Math.random() * 1000) % 100;
        
        child.value = newData;
        child.max = newData > 90 ? 'max' : '';
      }
    }

    this.perfMonitor.endProfile("render");
    this.timeout = setTimeout(this._update, this.levelSpeed);
  }

}));
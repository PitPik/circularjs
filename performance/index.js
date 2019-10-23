require(['circular'], function(Circular) {
  var circular = new Circular();

  var app = circular.component('app', {
    listeners: ['items.*'], // 'items.*.value', 'items.*.max'
  });

  var sliders = circular.component('sliders', {
    model: [{ levelSpeed: 10, levelRaster: 10 }],
    listeners: ['*'],
    subscribe: function(propName, item, value) {
      if (propName === 'levelRaster') {
        app.model = initModel(value, []);
        item.views.displayRaster.textContent =
          value + ' x ' + value + ' = ' + (value * value) + ' x 2 items';
        item.levelSpeed = item.levelSpeed;
      } else {
        item.views.displayRefresh.textContent =
          value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s): ' +
          (Math.round(item.levelRaster * item.levelRaster *
          (1000 / value) * 2) + '').replace(/(\d+)(\d{3})$/g, "$1.$2") + ' updates/s';
      }
      update(item);
    },
    eventListeners: {
      changeRaster: function(e, elm, item) {
        item.levelRaster = elm.value;
      },
      changeSpeed: function(e, elm, item) {
        item.levelSpeed = elm.value;
      },
    },
    onInit: function(self) {
      self.model[0].levelRaster = 10;
      self.model[0].levelSpeed = 400;
    }
  });
console.log(app.model)
  function initModel(raster, data) {
    for (var n = raster, newData = 0; n--; ) {
      data[n] = { items : [] };
      for (var m = raster; m--; ) {
        newData = Math.round(Math.random() * 1000) % 100;
        data[n].items.push({ value: newData, max: newData > 90 ? 'max' : '' });
      }
    }
    return data;
  }

  function update(model) {
    clearTimeout(model._timeout);
    model._timeout = setTimeout(function render() {
      // window.requestAnimationFrame(function() {
        for (var n = 0, m = app.model.length, newData = 0; n < m; n++) {
          for (var x = 0, y = app.model[n].items.length; x < y; x++) {
            newData = Math.round(Math.random() * 1000) % 100;
            app.model[n].items[x] = { value: newData, max: newData > 90 ? 'max' : '' };
            // app.model[n].items[x].foo.value = newData;
            // app.model[n].items[x].foo.max = newData > 90 ? 'max' : '';
          }
        }
        update(model);
      // })
    }, model.levelSpeed);
  }
});
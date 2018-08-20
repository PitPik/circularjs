require(['circular'], function(Circular) {
  var circular = new Circular();

  var app = circular.component('app', {
    listeners: ['items.*']
  });

  var sliders = circular.component('sliders', {
    model: [{ levelSpeed: 10, levelRaster: 10 }],
    listeners: ['*'],
    subscribe: function(propName, item, value) {
      if (propName === 'levelRaster') {
        app.reset(initModel(value, []));
        item.views.displayRaster.textContent =
          value + ' x ' + value + ' = ' + (value * value) + ' items';
        item.levelSpeed = item.levelSpeed;
      } else {
        item.views.displayRefresh.textContent =
          value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s): ' +
          (Math.round(item.levelRaster * item.levelRaster *
          (1000 / value)) + '').replace(/(\d+)(\d{3})$/g, "$1.$2") + ' updates/s';
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
      // update(self.model[0]);
      self.model[0].levelRaster = 10;
      self.model[0].levelSpeed = 400;
    }
  });

  function initModel(raster, data) {
    for (var n = raster; n--; ) {
      data[n] = { items : [] };
      for (var m = raster; m--; ) {
        data[n].items.push(Math.round(Math.random() * 98));
      }
    }
    return data;
  }

  function update(model) {
    clearTimeout(model._timeout);
    model._timeout = setTimeout(function render() {
      // window.requestAnimationFrame(function() {
        for (var n = 0, m = app.model.length; n < m; n++) {
          for (var x = 0, y = app.model[n].items.length; x < y; x++) {
            app.model[n].items[x] = Math.round(Math.random() * 98);
          }
        }
        update(model);
      // })
    }, model.levelSpeed);
  }
});
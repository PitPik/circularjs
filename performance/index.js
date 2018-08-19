require(['circular'], function(Circular) {
  var circular = new Circular();

  var app = circular.component('app', {
    listeners: ['items.*']
  });

  var raster = circular.component('raster-slider', {
    model: [{ level: 10 }],
    listeners: ['*'],
    subscribe: function(propName, item, value) {
      app.reset(initModel(value, []));
      item.views.display.textContent =
        value + ' x ' + value + ' = ' + (value * value) + ' items';
    },
    eventListeners: {
      change: function(e, elm, item) {
        item.level = elm.value;
      },
    },
  });

  var speed = circular.component('speed-slider', {
    model: [{ level: 800 }],
    listeners: ['*'],
    subscribe: function(propName, item, value) {
      update(item);
      item.views.display.textContent =
        value + 'ms (' + (Math.round(1000 / value * 100) / 100) + '/s)';
    },
    eventListeners: {
      change: function(e, elm, item) {
        item.level = elm.value;
      },
    },
    onInit: function(self) {
      update(self.model[0]);
      raster.model[0].level = raster.model[0].level;
      self.model[0].level = self.model[0].level;
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
      window.requestAnimationFrame(function() {
        for (var n = 0, m = app.model.length; n < m; n++) {
          for (var x = 0, y = app.model[n].items.length; x < y; x++) {
            app.model[n].items[x] = Math.round(Math.random() * 98);
          }
        }
        update(model);
      })
    }, model.level);
  }
});
require(['circular'], function(Circular) {
  var circular = new Circular();
  var $ = Circular.Toolbox.$;
  var model = { // menu model with states
    menu: [
      { title: 'Demo home', action: 'home', active: false },
      { title: 'Data binding', action: 'binding', active: false },
      { title: 'Dynamic tree', action: 'tree', active: false },
      { title: 'GitHub Commits', action: 'git', active: false }
    ],
    state: '',
  };

  circular.component('demo-nav', {
    model: [model],
    listeners: ['state', 'menu.*.active'],
    subscribe: function(propName, item, value, oldValue) {
      propName === 'state' && circular.renderModule({
        name: value,
        previousName: oldValue,
        path: 'demos/' + value + '.html',
        container: $('.module-outlet'),
        require: 'app-' + value,
        init: false,
      });
    },
  });

  circular.addRoute({
    path: '(/:state)',
    callback: function(data) {
      model.state = data.parameters.state || model.menu[0].action;
      model.menu.forEach(function(item) {
        item.active = item.action === model.state;
      });
    }
  }, true);
});
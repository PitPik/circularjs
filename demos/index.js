require(['circular'], function({ Component, Toolbox: { $ } }) {
  var elm = $('demo-nav');
  var templateElm = elm.removeChild(elm.firstElementChild);
  var model = [
    { title: 'Demo home', action: 'home', active: false },
    { title: 'Data binding', action: 'binding', active: false },
    { title: 'Dynamic tree', action: 'tree', active: false },
    { title: 'GitHub Commits', action: 'git', active: false }
  ];

  Component({
    selector: 'demo-nav',
    template: templateElm.outerHTML,
    subscribe$: {
      this: ['state'],
      menu: ['active'],
    },
  }, class DemoNav {
    state = '';
    menu = model;
    cr;

    constructor(rootElement, crInst) {
      this.cr = crInst;
      this.cr.addRoute({
        path: '(/:state)',
        callback: data => this.state = data.parameters.state || this.menu[0].action,
      }, true);
    }

    onInit() {
      this.state = this.state; // triggers this$()
    }

    this$(propName, item, value, oldValue) {
      this.menu.forEach(item => item.active = item.action === this.state);

      this.cr.renderModule({
        name: value,
        previousName: oldValue,
        path: 'demos/' + value + '.html',
        container: $('.module-outlet'),
        require: 'app-' + value,
        init: false,
      });
    }
  }).init('demo-nav');
});
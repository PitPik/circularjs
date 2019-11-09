require(['circular', 'replacer'], function({ Component, Toolbox: { $ } }, replacer) {
  var elm = $('demo-nav');
  var template = elm.removeChild(elm.firstElementChild).outerHTML;
  var model = [
    { title: 'Demo home', action: 'home', active: false },
    { title: 'Data binding', action: 'binding', active: false },
    { title: 'Dynamic tree', action: 'tree', active: false },
    { title: 'GitHub Commits', action: 'git', active: false }
  ];

  Component({
    selector: 'demo-nav',
    template,
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
        selector: 'app-' + value,
        container: '.module-outlet',
      }).then(() => value === 'home' ? null : require([
        '!' + value + '.html',
        '!' + value + '.js'
      ], (html, js) => replacer('.demo', js, html)));
    }
  }).init('demo-nav');
});
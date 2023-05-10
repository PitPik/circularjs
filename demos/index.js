require(['circular', 'replacer'], ({ App, Toolbox: { $ } }, replacer) =>

App({
  selector: 'demo-nav',
  template: '{{>@content}}',
  subscribe$: { this: ['state'], 'menu': [] },
},
class DemoNav {
  constructor(element, input, circular) {
    this.circular = circular;
    this.demo;
    this.state = '';
    this.menu = [
      { title: 'Demo home', action: 'index', active: false },
      { title: 'Data binding', action: 'binding', active: false },
      { title: 'Dynamic tree', action: 'tree', active: false },
      { title: 'SVG', action: 'svgx', active: false },
      { title: 'GitHub Commits', action: 'git', active: false }
    ];
  }

  onInit() {
    this.circular.addRoute({
      path: '(/:state)',
      callback: data => this.state = data.parameters.state || this.menu[0].action,
    }, true);
  }

  onChildInit(elm, inst, name) {
    require(['!' + name + '.html', '!' + name + '.js'], (html, js) => {
      replacer('.demo', js, html); // displays HTML and JS code in nice colors
    });
  }

  this$(propName, item, value, oldValue) {
    this.menu.forEach(item => item.active = item.action === this.state);

    this.circular.destroyComponent(this.demo, true);
    this.demo = this.circular.createComponent(value, {'cr-lazy': ''}, this);
  }
}));
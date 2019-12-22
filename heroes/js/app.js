define('app', ['circular'], ({ Module }) => Module({
  selector: 'app-main',
  template: `
    <section class="app-{{%currentApp}}">
      <h1>{{title}}{{#%currentApp}} - {{.}}{{/%currentApp}}</h1>
      <nav class="app-nav">
        <a href="#/dashboard" class="dashboard">Dashboard</a>
        <a href="#/heroes" class="heroes">Heroes</a>
      </nav>
      <div cr-view="app-modules"></div>
    </section>`,
  subscribe$: { this: ['currentApp'] },
}, class AppMain {
  constructor() {
    this.crInst = {};
    this.container = {};

    this.currentApp = '';
    this.title = 'Tour of Heroes';
  }

  onInit(elm, crInst, items) {
    this.crInst = crInst;
    this.container = items.views['app-modules'];

    crInst.addRoute({
      path: '(/:appName)(/*)',
      callback: data => this.currentApp = data.parameters.appName,
    }, true);
  }

  this$(property, item, value) {
    value && this.crInst.renderModule({
      require: 'app-' + value,
      container: this.container,
      init: true,
    });
  }
}));

define('app', ['circular'], ({ Module }) => Module({
  selector: 'app-main',
  template: `
    <section class="app-{{%currentApp}}">
      <h1>{{title}}{{#if %currentApp}} - {{%currentApp}}{{/if}}</h1>
      <nav class="app-nav">
        <a href="#/dashboard" class="dashboard">Dashboard</a>
        <a href="#/heroes" class="heroes">Heroes</a>
      </nav>
      <div cr-view="app-modules"></div>
    </section>`,
  subscribe$: { this: [] },
}, class AppMain {
  constructor(elm, init, crInst) {
    this.circular = crInst;
    this.container = {};
    this.apps = {};
    this.activeApp;

    this.currentApp = '';
    this.title = 'Tour of Heroes';
  }

  onInit(elm, crInst) {
    this.container = crInst.getView('app-modules', elm);

    crInst.addRoute({
      path: '(/:appName)(/*)',
      callback: data => this.currentApp = data.parameters.appName,
    }, true);
  }

  // onChildInit(elm) { // one way of solving it
  //   this.activeApp = elm;
  // }

  this$(property, item, value, oldValue) {
    if (!value) return;

    this.apps[oldValue] = this.circular.hideComponent(this.activeApp);
    this.activeApp = this.apps[value] ?
      this.apps[value]():
      this.circular.createComponent('app-' + value, {'cr-lazy': ''}, this, this.container);
  }
}));

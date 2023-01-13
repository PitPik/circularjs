define('app', ['circular'], ({ App }) =>

App({
  template: '{{>@content}}',
},
class AppMain {
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

  this$(property, item, value, oldValue) {
    if (!value) return;

    this.apps[oldValue] = this.circular.hideComponent(this.activeApp);
    this.activeApp = this.apps[value] ?
      this.apps[value]():
      this.circular.createComponent('app-' + value, {'cr-lazy': ''}, this, this.container);
  }
}));

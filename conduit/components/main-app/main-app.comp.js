require([
  'circular',
  'schnauzer',
  'global-partials',
  'data.service',
  'api.service',
  'navbar.comp',
  // also require components (in Module()) requested by renderModule()
  'home.component',
  'new-post.component',
  'settings.component',
  'sign-in.component',
  'profile.component'
],
({ Module }, Schnauzer, template, dataService, api) => Module({
  selector: '.main-app, main-app, [main-app]',
  subscribe$: { this: ['activeLink', 'routeParams', 'user'] },
}, class App {
  constructor(rootElement, crInst) {
    this.activeLink = {};
    this.routeParams = {};
    this.user = {};
  }

  setUser(user) {
    return this.user = user;
  }

  onInit(elm, crInst) {
    crInst.addRoute({
      path: '(/:appName)(/:var0)(/:var1)(/:var2)(/*)',
      callback: ({ parameters }) => {
        const oldActiveLink = this.activeLink; // performance, but no then
        this.activeLink = dataService.getLink(parameters.appName) || {};
        if (oldActiveLink.app !== this.activeLink.app) {
          crInst.renderModule({
            require: this.activeLink.app,
            container: 'app-outlet',
            input: 'routeParams, setUser, user',
            this: this,
          }).then(() => {
            this.routeParams = parameters;
          });
        } else this.routeParams = parameters;
        
      }
    }, true);
  }
}));
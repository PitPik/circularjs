require(['circular', 'app-data.srv', '!ui-components', 'template-helpers', 'marked'],
function(Circular, dataService, uiComponents, helpers, md) {
  const circular = new Circular({ helpers: helpers({ markdown: md }) });
  const app = circular.component('app', {
    model: [{
      currentApp: '',
      data: '',
      offset: 0,
      article: '',
      tag: '',
      ownFeed: false,
      favorited: false,

      author: '',
      isSameAuthor: false,
      isRegister: false,
    }],
    listeners: ['currentApp'],
    subscribe: renderModule,
    onInit: self => {
      const model = self.model[0];

      dataService.appData = model;
      dataService['user']({}).then(data => {
        model.user = data;
        renderMenu(model, model.currentApp, null, true);
        Circular.Toolbox.removeClass(model.views['navbar'], 'hidden');
      });

      md.setOptions({ sanitize: true });
      circular.template(uiComponents, { share: true }); // collect template-partials

      circular.addRoute({
        path: '(/:appName)(/:var0)(/:var1)(/:var2)(/*)',
        callback: data => routerCallback(data, model),
      }, true);
    }
  });

  function routerCallback(data, model) {
    const params = data.parameters;
    const pAppName = params.appName || 'articles';
    const var0 = params.var0;
    const var1 = params.var1;

    model.ownFeed = undefined;
    model.isSameAuthor = undefined;

    if (pAppName === 'editor' || pAppName === 'article') {
      model.slug = var0;
    } else if (pAppName === 'articles') {
      model.ownFeed = var1 === 'my-feed';
      model.tag = model.ownFeed ? '' : var1;
      model.offset = var0;
    } else if (pAppName === 'profile') {
      model.isSameAuthor = var0 === model.author;
      model.author = var0;
      model.offset = var1 || 0;
      model.favorited = params.var2 === 'favorites';
    }

    model.isRegister = var0 === 'register';
    model.currentApp = pAppName;
    model.wasRegister = model.isRegister;
  }

  function renderModule(property, item, value, oldValue) {
    setAppClasses(item, value, oldValue);
    renderMenu(item, value, oldValue);
    circular.renderModule({
      data: dataService[dataService[value] ? value : 'default']({
        cr: circular,
        limit: value === 'articles' ? 10 : 5,
        isSameApp: value === oldValue,
        // data from model
        author: item.author,
        offset: item.offset,
        article: item.slug,
        tag: item.tag,
        ownFeed: item.ownFeed,
        favorited: item.favorited,
        isSameAuthor: item.isSameAuthor,
        isRegister: item.isRegister,
        // ...
        user: item.user,
      }),
      name: value,
      previousName: oldValue,
      path: 'modules/' + value + '/index.html',
      container: !!property && item.views['app-modules'],
      require: 'app-' + value,
      dontWrap: true,
      transition: data => {
        data.promise.then(() => {
          data.remove();
          data.append();
        });
      },
    }).then(data => {
      app.element.classList.remove('pending-app');
      app.element.classList.remove('pending-sub-app');
    });
  }

  function setAppClasses(item, value, oldValue) {
    const toolbox = Circular.Toolbox;
    const element = item.elements.element;

    if (value !== oldValue) {
      toolbox.addClass(element, 'pending-app');
    }
    toolbox.addClass(element, 'pending-sub-app');
  }

  function renderMenu(item, value, oldValue) {
    const toolbox = Circular.Toolbox;
    const views = item.views;
    const element = item.elements.element;
    const userName = item.user && item.user.username;

    value = value === 'login' && item.isRegister ? 'register' : value;
    oldValue = item.wasRegister ? 'register' : oldValue;

    toolbox.toggleClass(element, 'logged-in', !!userName);
    toolbox.toggleClasses(element, element, oldValue, value);
    if (!userName || value === oldValue) return;

    views['user-name'].textContent = userName;
    views['user-link'].href = '#/profile/' + userName;
    views['user-image'].src = item.user.image;

    toolbox.toggleClass(views['user-link'], 'active',
      item.currentApp === 'profile' && item.author === userName);
  }
});
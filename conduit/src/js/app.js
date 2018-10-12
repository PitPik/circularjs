require(['circular', 'app-data.srv', '!ui-components', 'template-helpers', 'marked'],
function(Circular, dataSrv, uiComponents, helpers, md) {
  const toolbox = Circular.Toolbox;
  const removeClass = toolbox.removeClass;
  const addClass = toolbox.addClass;
  const toggleClass = toolbox.toggleClass;
  const circular = new Circular({ helpers: helpers({ markdown: md }) });

  const app = circular.component('app', {
    model: [{ // state model
      currentApp: '', // only pro-active component
      offset: 0,
      tag: '',
      slug: '',
      ownFeed: false,
      favorited: false,
      author: '',
      isSameAuthor: false,
      isRegister: false,
      wasRegister: false,
    }],
    listeners: ['currentApp'],
    subscribe: renderModule,
    onInit: self => {
      const model = self.model[0];

      dataSrv.appData = model;
      dataSrv['user']({}).then(data => {
        model.user = data;
        renderMenu(model, model.currentApp, null, true);
        removeClass(model.views['navbar'], 'hidden');
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
      model.offset = var0 || 0;
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
      data: dataSrv[dataSrv[value] ? value : 'default']({
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
      container: item.views['app-modules'],
      require: 'app-' + value,
      returnData: true, // returns data instead of require factory
      dontWrap: true, // does not wrap modules with DIV
      transition: data => {
        data.promise.then(() => {
          data.remove();
          data.append();
          removeClass(app.element, 'pending-app');
          removeClass(app.element, 'pending-sub-app');
        });
      },
    }).then(data => {
      const title = value === 'articles' ? 'Home' :
        value === 'article' ? data.article.article.title :
        value.charAt(0).toUpperCase() + value.substr(1);

      document.title = document.title.replace(/.*?- /, title + ' - ');
    });
  }

  function setAppClasses(item, value, oldValue) {
    const element = item.elements.element;

    if (value !== oldValue) {
      addClass(element, 'pending-app');
    }
    addClass(element, 'pending-sub-app');
  }

  function renderMenu(item, value, oldValue) {
    const views = item.views;
    const element = item.elements.element;
    const userName = item.user && item.user.username;

    value = value === 'login' && item.isRegister ? 'register' : value;
    oldValue = item.wasRegister ? 'register' : oldValue;

    toggleClass(element, 'logged-in', !!userName);
    toolbox.toggleClasses(element, element, oldValue, value);
    if (!userName || value === oldValue) return;

    views['user-name'].textContent = userName;
    views['user-link'].href = '#/profile/' + userName;
    views['user-image'].src = item.user.image;

    toggleClass(views['user-link'], 'active',
      item.currentApp === 'profile' && item.author === userName);
  }
});

// Comparison to AngularJS implementation on //demo.realworld.io
// and Angular 6 implementation on //angular.realworld.io
//
//                   | AngularJS | Angular 6 | CircularJS
// Source code loc   |      1340 |      1810 |        584
// Download          |     514KB |     332KB |      190KB
// JS Impl. + vendor |     317KB |     136KB |     25.5KB
// Performance       |     1.85s |     1.60s |      0.73s

define('template-helpers', [], function() {
  const dateCache = {
    short: {},
    numeric: {},
  };

  return (options) => ({
    // ----- block helpers... ----- //
    'itsme' : function($1, $2) {
      return this.getData($1) === this.getData($2) ?
        this.getBody() : this.gatAltBody();
    },
    'my-comment': function($1, $2) {
      return this.getData($1) === this.getData($2) ? this.getBody() : '';
    },
    // ----- inline helpers... ----- //
    'simple-date': function($1, $2) { // too slow, so we cache
      const date = this.getData($1);
      const options = {
        year: 'numeric',
        month: 'long',
        day: $2 === 'short' ? undefined : 'numeric',
      };
      const type = options.day || 'short';
      const key = date.substr(0, 10);

      dateCache[type][key] = dateCache[type][key] || new Date(date)
        .toLocaleDateString(undefined, options); // this is really slow...

      return dateCache[type][key];
    },
    'markdown': function($1) {
      return options.markdown(this.getData($1).trim());
    },
  });
});
/* ------------------------- */
define('form-helper', [], () => {
  const formHelpers = {
    parse: (formElements, arrays) => {
      const formData = {};

      formElements.forEach(elm => {
        elm.setAttribute('disabled', true);
        if(elm.name) { // TODO: client side validation
          formData[elm.name] = !elm.value ? null : elm.value.trim();
          if (arrays.indexOf(elm.name) !== -1 && formData[elm.name]) {
            formData[elm.name] = formData[elm.name].split(/,*\s(?:\s*,\s*)*\s*/);
          }
        }
      });

      return formData;
    },
    error: (error, errorComponent, formElements) => {
      const messages = JSON.parse(error.response);
      const out = [];
      const errors = Object.keys(messages.errors).forEach(key => {
        messages.errors[key].forEach(msg => {
          out.push({ message: `${key} ${msg}` });
        })
      });

      errorComponent.reset(out);
      formHelpers.enableForm(formElements);
    },
    enableForm: (formElements, reset) => {
      formElements.forEach(elm => {
        elm.removeAttribute('disabled');
        if (reset) {
          elm.value = '';
        }
      });
    },
  };

  return formHelpers;
});
/* ------------------------- */
define('app-data.srv', ['toolbox'], function(Toolbox) {
  const Promise = window.Promise || Toolbox.Promise;
  const rootURL = 'https://conduit.productionready.io/api/';
  const tokenName = 'jwtToken';
  const getToken = () => localStorage.getItem(tokenName);
  const loggedIn = () => !!dataService.appData.user;
  const postHeader = { 'Content-Type': 'application/json; charset=utf-8' };
  const baseConfig = { dataType: 'json' };
  const getConfig = (type, needHeader, config) => {
    const token = getToken();

    config.type = type && type.toUpperCase() || 'GET';
    if (needHeader) {
      config.headers = Object.assign({}, postHeader);
      if (token) {
        config.headers.Authorization = 'Token ' + token;
      }
    }
    return config;
  };
  const normalizeUserData = data => {
    if (data.user.image === null) data.user.image = '';
    if (data.user.bio === null) data.user.bio = '';
    localStorage.setItem(tokenName, data.user.token);
    dataService.appData.user = data.user;
    return data.user;
  };
  const fetch = (url, needHeader, cache, resetCache) =>
    Toolbox.ajax(url, getConfig('GET', needHeader,
      Object.assign({ cache: cache, resetCache: resetCache }, baseConfig)));
  const put = (url, type, data) => Toolbox.ajax(url, getConfig(type || 'POST', true,
    Object.assign(data ? { data: JSON.stringify(data || {}) } : {}, baseConfig)));
  const getUser = options => options.user || !getToken() ?
    new Promise(resolve => resolve(options.user && JSON.parse(JSON.stringify(options.user)))) :
    fetch(`${rootURL}user`, true, 500).then(normalizeUserData) // 500 -> debounce
      .catch(() => localStorage.removeItem(tokenName));
  const dummyPromise = new Promise(resolve => resolve());
  const getPaginaionModel = (data, count) => Array.apply(null,
      { length: Math.ceil((count < data.limit + 1 ? 0 : count) / data.limit) })
    .map((v, i) => ({
      value: i + 1 + '',
      active: data.offset !== undefined && data.offset == i,
      tag: data.tag,
      ownFeed: data.ownFeed,
      author: data.author,
      favorited: data.favorited,
    }));

  const dataService = {
    appData: undefined,
    // -- FETCH -------------------------------------------- //
    'user' : options => getUser(options),
    'default': options => getUser(options).then(data => ({
      cr: options.cr,
      user: data,
      isRegister: options.isRegister,
    })),
    'articles': options => Promise.all([
      fetch(`${rootURL}articles${options.ownFeed ?
        '/feed' : ''}?limit=${options.limit}&offset=${options.offset *
        options.limit}${options.tag ? '&tag=' + options.tag : ''}`, getToken())
      .catch(() => window.location.href = '#/login'),
      options.isSameApp ? dummyPromise : fetch(`${rootURL}tags`, false, 30000),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      articles: data[0],
      tags: data[1],
      user: data[2],
      loggedIn: loggedIn,
      tag: options.tag,
      ownFeed: options.ownFeed,
      pagination: getPaginaionModel(options, data[0].articlesCount),
    })),
    'article': options => Promise.all([
      fetch(`${rootURL}articles/${options.article}`, getToken()),
      fetch(`${rootURL}articles/${options.article}/comments`),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      article: data[0],
      comments: data[1],
      user: data[2],
      loggedIn: loggedIn,
    })),
    'editor': options => Promise.all([
      options.article ? fetch(`${rootURL}articles/${options.article}`, getToken()) : dummyPromise,
    ]).then(data => ({
      cr: options.cr,
      article: data[0],
    })),
    'profile': options => Promise.all([
      options.isSameAuthor ? dummyPromise : fetch(`${rootURL}profiles/${options.author}`, getToken()),
      fetch(`${rootURL}articles?${options.favorited ? 'favorited' : 'author'}=${encodeURIComponent(
        options.author)}&limit=${options.limit}&offset=${options.offset * options.limit}`, getToken()),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      profile: data[0],
      articles: data[1],
      user: data[2],
      loggedIn: loggedIn,
      tag: options.tag,
      favorited: options.favorited,
      pagination: getPaginaionModel(options, data[1].articlesCount),
    })),
    // -- PUT ----------------------------------------- //
    'userLogin': data => put(`${rootURL}users/login`, null, data).then(normalizeUserData),
    'userLogout': data => new Promise(resolve => {
      localStorage.removeItem(tokenName);
      dataService.appData.user = undefined;
      resolve();
    }),
    'userSignup': data => put(`${rootURL}users`, null, data).then(normalizeUserData),
    'putSettings': data => put(`${rootURL}user`, 'PUT', data.user),
    'postArticle': data => !data.slug ? put(`${rootURL}articles`, 'POST', data) :
       put(`${rootURL}articles/${data.slug}`, 'PUT', data),
    'deleteArticle': data => put(`${rootURL}articles/${data.slug}`, 'DELETE'),
    'postComment': data => put(`${rootURL}articles/${data.slug}/comments`, 'POST', data.comment),
    'deleteComment': data => put(`${rootURL}articles/${data.slug}/comments/${data.id}`, 'DELETE'),
    'postLike': data => put(`${rootURL}articles/${data.slug}/favorite`,
      data.favorited ? 'DELETE' : 'POST'),
    'postFollow': data => put(`${rootURL}profiles/${data.author.username}/follow`,
      data.author.following ? 'DELETE' : 'POST'),
  };
  return dataService;
});
/* ------------------------- */
define('article-preview', ['app-data.srv'], dataSrv => (circular, articles, name, loggedIn) => {
  circular.component({
    name: name || 'article-preview',
    listeners: ['favoritesCount', 'favorited'],
    model: articles,
    eventListeners: {
      like: (e, elm, item) => loggedIn() ?
        dataSrv.postLike(item).then(response => {
          item.favoritesCount += item.favorited ? -1 : 1;
          item.favorited = !item.favorited;
        }) : window.location.href = '#/login',
      getTag: (e, elm, item) => {
        e.preventDefault();
        window.location.href = '#/articles/0/' + elm.textContent;
      },
    },
  });
});
/* ------------------------- */
define('app-article', ['app-data.srv'], dataSrv => promise => promise.then(data => {
  const comments = data.cr.component('comments', {
    model: data.comments.comments.map(item => {
      item.slug = data.article.article.slug;
      return item;
    }),
    extraModel: data.user,
    eventListeners: {
      delete: function(e, elm, item) {
        dataSrv.deleteComment({ id: item.id, slug: item.slug })
          .then(response => this.removeChild(item));
      },
    },
  });

  data.cr.component('form', {
    model: [{ user: data.user || {}, slug: data.article.article.slug }],
    extraModel: { author: data.article.article.author },
    eventListeners: {
      submit: function(e, elm, item) {
        const text = item.views.textarea.value.trim();

        e.preventDefault();
        text && dataSrv.postComment({
          comment: { comment: { body: text } },
          slug: item.slug,
        }).then(response => {
          response.comment.slug = item.slug;
          comments.prependChild(response.comment);
          item.views.textarea.value = '';
        });
      }
    },
  });

  data.cr.component('article', {
    listeners: ['favoritesCount', 'favorited', 'author.following'],
    model: [data.article.article],
    extraModel: {
      loggedIn: !!data.user,
      isMine: data.user && data.user.username === data.article.article.author.username
    },
    eventListeners: {
      like: (e, elm, item) => data.loggedIn() ? dataSrv.postLike(item).then(response => {
        item.favoritesCount += item.favorited ? -1 : 1;
        item.favorited = !item.favorited;
      }) : window.location.href = '#/login',
      follow: (e, elm, item) => data.loggedIn() ? dataSrv.postFollow(item).then(response => {
        item.author.following = !item.author.following;
      }) : window.location.href = '#/login',
      delete: (e, elm, item) => dataSrv.deleteArticle(item).then(response => {
        window.location.href = `#/profile/${data.user.username}`;
      }),
    },
  });
}));
/* ------------------------- */
define('app-articles', ['article-preview'], articlePreview =>
promise => promise.then(data => {
  articlePreview(data.cr, data.articles.articles, null, data.loggedIn);

  data.cr.component('pagination', { model: data.pagination });

  data.tags && data.cr.component('tag-list', {
    model: data.tags.tags.map(tag => ({ tag: tag })), // , offset: data.offset
  });

  data.cr.component('feed-toggle', {
    model: [{ user: data.user, tag: data.tag, ownFeed: data.ownFeed }],
    listeners: ['ownFeed'],
    subscribe: (prop, item, value, oldValue) => {
      const toggle = data.cr.Toolbox.toggleClass;
      const views = item.views;

      toggle(views['own'], 'hidden', !item.user);
      toggle(views['own-link'], 'active', !item.tag && item.ownFeed);
      toggle(views['global'], 'active', !item.tag && !item.ownFeed);
      toggle(views['tags'], 'hidden', !item.tag);
      views['tags-link'].textContent = item.tag ? `# ${item.tag}` : '';
    },
    eventListeners: {
      prerender: (e, elm, item) => { // speed up ui-feedback
        item.tag = '';
        item.ownFeed = elm === item.views['own-link'];
      }
    },
    onInit: self => (self.model[0].ownFeed = self.model[0].ownFeed, self.uncloak()),
  });
}));
/* ------------------------- */
define('app-editor', ['app-data.srv', 'form-helper'], (dataSrv, formHelper) =>
promise =>  promise.then(data => {
  data.cr.component('editor', {
    model: [data.article ? Object.assign(data.article.article, {
      textLength: data.article.article.body.length > 3,
      isPreviewing: false,
    }) : { textLength: 0, isPreviewing: false }],
    listeners: ['textLength', 'isPreviewing'],
    eventListeners: {
      submit: (e, elm, item) => {
       const formElements = [].slice.call(item.elements.element.elements); // TODO
       const formData = formHelper.parse(formElements, ['tagList']);

        e.preventDefault();

        dataSrv.postArticle({ article: formData, slug: item.slug }).then(response => {
          formHelper.enableForm(formElements);
          window.location.href = `#/article/${response.article.slug}`;
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
      input: (e, elm, item) => item.textLength = elm.value.length > 3,
      preview: (e, elm, item) => {
        item.body = item.views.editor.value;
        item.views.preview.style.height = item.views.editor.offsetHeight + 'px';
        item.isPreviewing = !item.isPreviewing;
      },
    },
  });

  const errorComponent = data.cr.component('error-messages', { model: [] })
}));
/* ------------------------- */
define('app-login', ['app-data.srv', 'form-helper'], (dataSrv, formHelper) =>
promise =>  promise.then(data => {
  const login = data.cr.component('login', {
    model: [{ register: data.isRegister }],
    eventListeners: {
      submit: (e, elm, item) => {
        const formElements = [].slice.call(item.views.form);
        const service = item.register ? 'userSignup' : 'userLogin';
        const formData = formHelper.parse(formElements, []);

        e.preventDefault();

        dataSrv[service]({ user: formData }).then(response => {
          formHelper.enableForm(formElements, true);
          window.location.href = '#/articles/0/my-feed'
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
    },
  });

  const errorComponent = data.cr.component('error-login', { model: [] });
  const views = login.model[0].views;
  const toggleClass = data.cr.Toolbox.toggleClass;

  toggleClass(views['username'], 'hidden', !data.isRegister);
  if (!data.isRegister) {
    views['username'].setAttribute('disabled', true);
  } else {
     views['username'].removeAttribute('disabled');
  }

  toggleClass(views['register'], 'hidden', !data.isRegister);
  toggleClass(views['login'], 'hidden', data.isRegister);
}));
/* ------------------------- */
define('app-profile', ['article-preview', 'app-data.srv'], (articlePreview, dataSrv) =>
promise => promise.then(data => {
  articlePreview(data.cr, data.articles.articles, 'articles', data.loggedIn);

  if (data.profile) {
    data.cr.component('profile', {
      model: [{ author: data.profile.profile }],
      extraModel: { user: data.user && data.user.username },
      listeners: ['author.following'],
      eventListeners: {
        follow: (e, elm, item) => data.loggedIn() ? dataSrv.postFollow({
            author: item.author
        }).then(response => {
          item.author.following = response.profile.following;
        }) : window.location.href = '#/login',
      },
    });
  }

  data.cr.component('profile-pagination', { model: data.pagination });

  data.cr.component('article-toggle', {
    model: [{
      user: data.user,
      ownFeed: !data.favorited,
      profileUser: data.cr.components['profile'].model[0].author.username,
    }],
    listeners: ['ownFeed'],
    subscribe: (prop, item, value, oldValue) => {
      const toggle = data.cr.Toolbox.toggleClass;
      const regex = /#\/profile\/[^/]+/;
      const profilePath = `#/profile/${item.profileUser}`;

      toggle(item.views['own-link'], 'active', item.ownFeed);
      toggle(item.views['favorite-link'], 'active', !item.ownFeed);

      item.views['own-link'].href = item.views['own-link'].href
        .replace(regex, () => profilePath);
      item.views['favorite-link'].href = item.views['favorite-link'].href
        .replace(regex, () => profilePath);
    },
    eventListeners: {
      prerender: (e, elm, item) => { // speed up ui-feedback
        item.ownFeed = elm === item.views['own-link'];
      }
    },
    onInit: self => (self.model[0].ownFeed = self.model[0].ownFeed, self.uncloak()),
  });
}));
/* ------------------------- */
define('app-settings', ['app-data.srv', 'form-helper'], (dataSrv, formHelper) =>
promise => promise.then(data => {
  data.cr.component('settings', {
    model: [data.user],
    eventListeners: {
      logout: () => dataSrv.userLogout().then(() => window.location.href = '#/'),
      submit: (e, elm, item) => {
        const formElements = [].slice.call(item.views.form);
        const formData = formHelper.parse(formElements, []);

        e.preventDefault();
        dataSrv.putSettings({ user: formData }).then(response => {
          formHelper.enableForm(formElements);
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
    },
  });

  const errorComponent = data.cr.component('error-settings', { model: [] });
}));
/* ------------------------- */
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
      path: undefined,
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
    const path = data.path.join('/');

    if (model.path === path) return;
    model.path = path;

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
    views['home-link'].href = userName ? '#/articles/0/my-feed' : '#';
    toggleClass(views['user-link'], 'active',
      item.currentApp === 'profile' && item.author === userName);
    if (!userName || value === oldValue) return;

    views['user-name'].textContent = userName;
    views['user-link'].href = '#/profile/' + userName;
    views['user-image'].src = item.user.image;

  }
});

require([
  'circular',
  'data.service',
  'api.service',
  'navbar.comp',
  // also require components requested by renderModule()
  'home.component',
  'new-post.component',
  'settings.component',
  'sign-in.component',
  'profile.component'
],
({ Module, Toolbox: { Promise } }, dataService, apiService) => Module({
  selector: '[main-app]',
  subscribe$: { this: ['*'] },
  styles: `
    .loader { clear: both; padding: 1em 0; display: none; }
    .loading article-list { display: none }
    .loading .loader { display: block }`,
}, class MainApp {
  constructor() {
    this.activeLink = {};

    this.tag = '';
    this.articleSlug = '';
    this.user = {};
    this.isLoggedIn = false;
    this.articles = [];
    this.pagination = [];
    this.profile = [];
    this.profileName = '';
    this.tags = [];
    this.myArticles = [];
    this.myPagination = [];
    this.myArticle = {};
    this.comments = [];
    this.article = [];
  }

  onInit(elm, crInst, items) {
    crInst.addRoute({
      path: '(/:appName)(/:var0)(/:var1)(/:var2)(/*)',
      callback: ({ parameters: params }) => {
        const previousApp = this.activeLink.app;
        this.activeLink = dataService.getLink(params.appName) || {};
        const currentApp = this.activeLink.app || '';
        items.views.outlet.className =
          `loading${/^art/.test(currentApp) ? '-article' : ''}`;

        this.getData(currentApp, params.var0, params.var1, params.var2)
          .then(data => this.delegateData(data, params.appName, params.var0))
          .then(() => {
            this.articleSlug = params.var0 || '';
            items.views.outlet.className = '';
            if (previousApp === currentApp) return;
            this.updateView(currentApp, items.views.outlet, crInst);
          });
        },
    }, true);
  }

  getData(require, $0, $1, $2) {
    const app = require.substring(0, 3);
    const user = this.user && this.user.username ? this.user : undefined;

    this.tag = app === 'hom' ? $1: '';

    switch (app) {
      case 'hom': return apiService.articles({
        limit: 10, offset: $0 || 0, tag: $1, ownFeed: $1 === 'my-feed', user
      });
      case 'pro': return apiService.profile({
        limit: 5, offset: $1 || 0, author: $0, favorited: !!$2, user
      });
      case 'art': return apiService.article({ article: $0, user });
      case 'new': return this.article[0] || !$0 ?
        new Promise(res => res(this.article[0] || {})) :
        apiService.article({ article: $0, user }); // on reload
      default: return new Promise(res => res({}));
    }
  }

  delegateData(data, appName, $0) {
    const isHome = !appName || appName === 'articles';

    if (data.user) {
      this.user = data.user;
      this.isLoggedIn = this.user && !!this.user.username;
    }
    if (data.articles && isHome) this.articles = data.articles;
    if (data.pagination && isHome) this.pagination = data.pagination;
    if (data.tags) this.tags = data.tags.map(item => ({ key: item }));
    if (data.articles && !isHome) this.myArticles = data.articles;
    if (data.pagination && !isHome) this.myPagination = data.pagination;
    if (data.article) {
      this.article = [data.article];
      const isMine = this.user.username === data.article.author.username;
      this.myArticle = { // for convenience -> edit post
        title: isMine ? data.article.title : '',
        description: isMine ? data.article.description: '',
        body: isMine ? data.article.body: '',
        tagList: isMine ? data.article.tagList.join(', '): '',
      }
    }
    if (data.comments) this.comments = data.comments.map(item => {
      item.isUser = data.user && data.user.username === item.author.username;
      return item;
    });
    if (data.profile) {
      this.profileName = data.profile.username;
      this.profile = [{
        isUser: data.user && data.profile.username === data.user.username,
        ...data.profile,
        bio: data.profile.bio || '',
      }];
    };
  }

  updateView(require, container, crInst) {
    const app = require.substring(0, 3);
    const input = `user, tag, profileName, isLoggedIn${
      app === 'hom' ? ',articles, pagination, tags' :
      app === 'art' ? ',article, articleSlug, comments' :
      app === 'new' ? ',articleSlug, myArticle as article' :
      app === 'pro' ? ',profile, myArticles as articles, myPagination as pagination' :
      app === 'sig' ? ',activeLink' : ''
    }`;
    const transition = (remove, append) => {
      remove(); // TODO: make nice transition
      append();
    }

    crInst.renderModule({ require, container, input, this: this, transition })
      .then(items => {});
  }
}));

require([
  'circular',
  '!home.component.html',
  'api.service',
  'article-list.component',
  'tag-list.component',
  'feed-menu.component',
  'banner.component',
], ({ Component }, template, api) => Component({
  selector: 'home',
  template,
  subscribe$: {
    this: ['routeParams', 'articles', 'tags', 'tag', 'pagination', 'isLoggedIn', 'user'],
  },
}, class Home {
  constructor(elm, crInst, input, getRoot, type) {
    this.routeParams = {};
    this.setUser = () => {};
    this.user = {};
    input(this);
    this.articles = [];
    this.tags = [];
    this.tag = '';
    this.pagination = [];
    this.isLoggedIn = false;
    this.type = type; // TODO: load profile stuff

    if (!type) {
      // this.getArticles(+this.routeParams.var0 - 1, this.routeParams.var1 || '');
    }
  }

  getArticles(offset, tag, limit = 10, author, favorited = false) {
    offset = offset >= 0 ? offset: 0;
    this.tag = tag;
    return api.articles({
      limit, offset, tag, ownFeed: tag === 'my-feed', author,
      root: this.type, favorited,
      user: this.user && this.user.username ? this.user : undefined, // TODO: in api
    }).then(data => {
      this.isLoggedIn = data.loggedIn();
      this.setUser(data.user);

      this.articles = data.articles;
      this.tags = data.tags.map(item => ({ key: item }));
      this.pagination = data.pagination;
    });
  }

  this$(prop, item, value) {
    if (value && value.appName !== 'articles' && value.appName || prop === 'user') return;
    if (prop === 'routeParams' && !this.type) {
      this.getArticles(+value.var0 - 1, value.var1 || '');
    }
  }
}));
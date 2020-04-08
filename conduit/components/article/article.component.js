require([
  'circular',
  '!article.component.html',
  'api.service',
  'template-helpers',
  'global-partials',
  'article-meta.component',
  'article-comment-list.component',
  'article-comment-form.component',
], ({ Component }, template, api, helpers, partials) => Component({
  selector: 'article',
  template,
  partials,
  styles: 'article .tag-list { text-align: right }',
  helpers,
  subscribe$: {
    this: ['routeParams', 'articleSlug', 'article', 'comments', 'metaData', 'user'],
    article: ['*'],
  },
}, class Article {
  constructor(elm, crInst, input) {
    this.routeParams = {};
    this.setUser = () => {};
    this.user = {};
    input(this);
    this.articleSlug = '';
    this.article = [];
    this.comments = [];
    this.metaData = {};
  }

  onInit() {
    this.triggerLoadData();
  }

  triggerLoadData() {
    this.articleSlug = this.routeParams.var0;
  }

  this$(prop, item, value, oldValue) {
    if (prop === 'routeParams' && value.appName === 'article') { // TODO
      this.articleSlug = value.var0;
    }
    if (this.routeParams.appName !== 'article') return;
    if (prop === 'articleSlug' && value) {
      const user = this.user && this.user.username ? this.user : undefined;
      api.article({ article: value, user }).then(data => {
        data.article.isLoggedIn = data.loggedIn(); // TODO...
        this.setUser(data.user);
        this.article = [data.article];
        this.comments = data.comments
          .map(item => {
            item.isUser = data.user && data.user.username === item.author.username;
            return item;
          });
        this.metaData = {
          author: { ...data.article.author },
          favorited: data.article.favorited,
          favoritesCount: data.article.favoritesCount,
          createdAt: data.article.createdAt,
        }
      });
    }
  }
}));
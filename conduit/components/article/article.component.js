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
    this: ['articleSlug', 'isLoggedIn', 'article', 'comments', 'metaData', 'user'],
    article: ['*'],
  },
}, class Article {
  constructor(elm, crInst, input) {
    this.user = {};
    this.articleSlug = '';
    this.isLoggedIn = false;
    this.article = [];
    this.comments = [];
    input(this);
    this.metaData = this.getMetaData(this.article[0]);
    this.article[0].isLoggedIn = this.isLoggedIn;
  }

  this$(prop) {
    if (prop !== 'articleSlug') return;
    this.metaData = this.getMetaData(this.article[0]);
    this.article[0].isLoggedIn = this.isLoggedIn;
  }

  getMetaData(article) {
    return {
      author: { ...article.author },
      favorited: article.favorited,
      favoritesCount: article.favoritesCount,
      createdAt: article.createdAt,
    }
  }
}));
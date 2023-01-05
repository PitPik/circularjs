require([
  'circular',
  '!article-list.component.html',
  'template-helpers',
  'global-partials',
  'article-list-pagination.component',
  'article-meta.component',
], ({ Component, Toolbox: { lazy } }, template, helpers, partials) => Component({
  selector: 'article-list',
  template,
  partials,
  helpers,
  styles: `
    article-list .tag-list { float: right; max-width: 75%; }
    article-list .article-preview { clear: both }`,
  subscribe$: { this: ['pagination', 'noItems', 'trigger', 'user'], articles: ['*', 'author.*'] },
}, class ArticleList {
  constructor(elm, crInst, input) {
    this.user = {};
    this.articles = [];
    this.pagination = [];
    input(this);
    this.noItems = !this.articles.length;
    this.trigger = false;
  }

  onInit() {
    this.articles.forEach(item => this.trigger = item.index);
  }

  articles$$(prop, item, value, oldValue) {
    lazy(() => { // wait for all data to be updated
      this.trigger = item.index;
      this.noItems = !this.articles.length;
    }, item);
  }
}));
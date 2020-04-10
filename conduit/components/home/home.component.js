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
    this: ['articles', 'tags', 'tag', 'pagination', 'user', 'isLoggedIn'],
  },
}, class Home {
  constructor(elm, crInst, input) {
    this.user = {};
    this.isLoggedIn = false;
    this.articles = [];
    this.pagination = [];
    this.tags = [];
    this.tag = '';
    input(this);
  }
}));
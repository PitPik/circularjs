require([
  'circular',
  '!home.component.html',
  'article-list.component',
  'tag-list.component',
  'feed-menu.component',
  'banner.component',
], ({ Component }, template) => Component({
  selector: 'home',
  template,
  subscribe$: { this: ['*'] },
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
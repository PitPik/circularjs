require([
  'circular',
  '!article-comment-list.component.html',
  'template-helpers',
  'api.service',
], ({ Component }, template, helpers, api) => Component({
  selector: 'article-comment-list',
  template,
  helpers,
  styles: '',
  subscribe$: { this: ['comments', 'articleSlug'], comments: ['*', 'author.*'] },
}, class ArticleCommentList {
  constructor(elm, crInst, input, getRoot) {
    this.comments = [];
    this.articleSlug = '';
    input(this);
    this.rootApp = getRoot();
  }

  delete(e, elm, item) {
    api.deleteComment({ id: item.id, slug: this.articleSlug }).then(data => {
      this.rootApp.triggerLoadData();
    });
  }
}));
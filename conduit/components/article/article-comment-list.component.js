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
  constructor(elm, crInst, input) {
    this.comments = [];
    this.articleSlug = '';
    input(this);
  }

  delete(e, elm, item) {
    api.deleteComment({ id: item.id, slug: this.articleSlug }).then(data => {
      window.location.href = `#/article/${this.articleSlug}`;
    });
  }
}));
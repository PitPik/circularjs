require([
  'circular',
  '!article-comment-form.component.html',
  'template-helpers',
  'api.service',
], ({ Component }, template, helpers, api) => Component({
  selector: 'article-comment-form',
  template,
  helpers,
  subscribe$: { this: ['articleSlug'] },
}, class ArticleCommentForm {
  constructor(elm, crInst, input, getRoot) {
    this.user = {};
    this.articleSlug = '';
    input(this);
    this.rootApp = getRoot();
  }

  submit(e, elm, item) {
    e.preventDefault();
    api.postComment({
      comment: { comment: api.getFormData(elm) },
      slug: this.articleSlug
    }).then(data => {
      api.resetForm(elm);
      this.rootApp.triggerLoadData();
    });
  }
}));
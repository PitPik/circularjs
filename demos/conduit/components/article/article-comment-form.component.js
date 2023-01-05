require([
  'circular',
  '!article-comment-form.component.html',
  'template-helpers',
  'api.service',
  'forms.service',
], ({ Component }, template, helpers, api, forms) => Component({
  selector: 'article-comment-form',
  template,
  helpers,
  subscribe$: { this: ['articleSlug'] },
}, class ArticleCommentForm {
  constructor(elm, crInst, input) {
    this.user = {};
    this.articleSlug = '';
    input(this);
  }

  submit(e, elm, item) {
    e.preventDefault();
    api.postComment({
      comment: { comment: forms.getFormData(elm) },
      slug: this.articleSlug
    }).then(data => {
      forms.resetForm(elm);
      window.location.href = `#/article/${this.articleSlug}`;
    });
  }
}));
require(['circular', '!new-post.component.html', 'api.service', 'forms.service'],
({ Component }, template, api, forms) => Component({
  selector: 'new-post',
  template,
  subscribe$: {
    this: ['article', 'articleSlug', 'formDisabled', 'title', 'description', 'body', 'tagList'],
  },
}, class NewPost {
  constructor(elm, crInst, input, getRoot) {
    this.article = {};
    this.articleSlug = '';
    input(this);
    this.formDisabled = false;
    this.errors = [];

    this.title = ''; // single field approach (no cr-for); experiment
    this.description = '';
    this.body = '';
    this.tagList = '';
    this.updateInstance(this.article);
  }

  this$(prop) {
    if (prop !== 'articleSlug') return;
    this.updateInstance(this.article);
  }

  updateInstance(article) {
    const slug = this.articleSlug;
    this.title = slug ? article.title : '';
    this.description = slug ? article.description : '';
    this.body = slug ? article.body : '';
    this.tagList = slug ? article.tagList : '';
  }

  submit(e, elm, item) {
    e.preventDefault();
    this.formDisabled = true;
    this.errors = [];
  
    const data = forms.getFormData(elm);
    data.tagList = data.tagList.split(/,*\s(?:\s*,\s*)*\s*/);

    api.postArticle({ article: data, slug: this.articleSlug })
      .then(data => {
        this.formDisabled = false;
        window.location.href = `#/article/${data.article.slug}`;
      })
      .catch(error => {
        this.formDisabled = false;
        this.errors = forms.processErrors(error);
      });
  }
}));
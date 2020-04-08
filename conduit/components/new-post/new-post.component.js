require(['circular', '!new-post.component.html', 'api.service'],
({ Component }, template, api) => Component({
  selector: 'new-post',
  template,
  subscribe$: {
    this: ['routeParams', 'formDisabled', 'title', 'description', 'body', 'tagList'],
  },
}, class NewPost {
  constructor(elm, crInst, input, getRoot) {
    this.routeParams = {};
    this.setUser = () => {};
    input(this);
    this.formDisabled = false;
    this.errors = [];
    this.model = [];
    this.formElm = {};

    this.title = ''; // single feald approach (no cr-for); experiment
    this.description = '';
    this.body = '';
    this.tagList = '';
  }

  onInit(elm, crInst, inst) {
    this.formElm = inst.views.form;
  }

  this$(prop, item, value) {
    if (prop === 'routeParams') {
      if ((value.appName || '').indexOf('new') === -1) return;
      this.errors = [];
      if (value.var0) {
        api.article({ article: value.var0 }).then(data => {
          this.setUser(data.user);
          this.title = data.article.title;
          this.description = data.article.description;
          this.body = data.article.body;
          this.tagList = data.article.tagList.join(', ');
        });
      } else {
        api.resetForm(this.formElm);
      }
    }
  }

  submit(e, elm, item) {
    e.preventDefault();
    this.formDisabled = true;
    this.errors = [];
  
    const data = api.getFormData(elm);
    data.tagList = data.tagList.split(/,*\s(?:\s*,\s*)*\s*/);

    api.postArticle({ article: data, slug: this.routeParams.var0 })
    .then(data => {
      this.formDisabled = false;
      window.location.href = `#/article/${data.article.slug}`;
    })
    .catch(error => {
      this.formDisabled = false;
      this.errors = api.processErrors(error);
    });
  }
}));
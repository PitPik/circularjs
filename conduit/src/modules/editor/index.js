define('app-editor', ['app-data.srv', 'form-helper'], (dataSrv, formHelper) =>
promise =>  promise.then(data => {
  data.cr.component('editor', {
    model: [data.article ? Object.assign(data.article.article, {
      textLength: data.article.article.body.length > 3,
      isPreviewing: false,
    }) : { textLength: 0, isPreviewing: false }],
    listeners: ['textLength', 'isPreviewing'],
    eventListeners: {
      submit: (e, elm, item) => {
       const formElements = [].slice.call(item.elements.element.elements); // TODO
       const formData = formHelper.parse(formElements, ['tagList']);

        e.preventDefault();

        dataSrv.postArticle({ article: formData, slug: item.slug }).then(response => {
          formHelper.enableForm(formElements);
          window.location.href = `#/article/${response.article.slug}`;
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
      input: (e, elm, item) => item.textLength = elm.value.length > 3,
      preview: (e, elm, item) => {
        item.body = item.views.editor.value;
        item.views.preview.style.height = item.views.editor.offsetHeight + 'px';
        item.isPreviewing = !item.isPreviewing;
      },
    },
  });

  const errorComponent = data.cr.component('error-messages', { model: [] })
}));

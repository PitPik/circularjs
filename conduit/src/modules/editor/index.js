define('app-editor', ['app-data.srv', 'form-helper'], (dataService, formHelper) =>
promise =>  promise.then(data => {
  data.cr.component('editor', {
    model: [data.article ? data.article.article : {}],
    eventListeners: {
      submit: (e, elm, item) => {
       const formElements = [].slice.call(item.elements.element.elements); // TODO
       const formData = formHelper.parse(formElements, ['tagList']);

        e.preventDefault();

        dataService.postArticle({ article: formData, slug: item.slug }).then(response => {
          formHelper.enableForm(formElements);
          window.location.href = `#/article/${response.article.slug}`;
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
    },
  });

  const errorComponent = data.cr.component('error-messages', { model: [] })
}));
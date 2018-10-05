define('app-login', ['app-data.srv', 'form-helper'], (dataService, formHelper) =>
promise =>  promise.then(data => {
  const login = data.cr.component('login', {
    model: [{ register: data.isRegister }],
    eventListeners: {
      submit: (e, elm, item) => {
        const formElements = [].slice.call(item.views.form);
        const service = item.register ? 'userSignup' : 'userLogin';
        const formData = formHelper.parse(formElements, []);

        e.preventDefault();

        dataService[service]({ user: formData }).then(response => {
          formHelper.enableForm(formElements, true);
          window.location.href = '#/articles/0/my-feed'
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
    },
  });

  const errorComponent = data.cr.component('error-login', { model: [] });
  const views = login.model[0].views;
  const toggleClass = data.cr.Toolbox.toggleClass;

  toggleClass(views['username'], 'hidden', !data.isRegister);
  if (!data.isRegister) {
    views['username'].setAttribute('disabled', true);
  } else {
     views['username'].removeAttribute('disabled');
  }

  toggleClass(views['register'], 'hidden', !data.isRegister);
  toggleClass(views['login'], 'hidden', data.isRegister);
}));
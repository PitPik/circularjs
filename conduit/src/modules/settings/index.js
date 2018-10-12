define('app-settings', ['app-data.srv', 'form-helper'], (dataSrv, formHelper) =>
promise => promise.then(data => {
  data.cr.component('settings', {
    model: [data.user],
    eventListeners: {
      logout: () => dataSrv.userLogout().then(() => window.location.href = '#/'),
      submit: (e, elm, item) => {
        const formElements = [].slice.call(item.views.form);
        const formData = formHelper.parse(formElements, []);

        e.preventDefault();
        dataSrv.putSettings({ user: formData }).then(response => {
          formHelper.enableForm(formElements);
        }).catch(error => {
          formHelper.error(error, errorComponent, formElements);
        });
      },
    },
  });

  const errorComponent = data.cr.component('error-settings', { model: [] });
}));

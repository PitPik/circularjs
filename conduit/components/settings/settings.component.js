require(['circular', '!settings.component.html', 'api.service', 'forms.service'],
({ Component }, template, api, forms) => Component({
  selector: 'settings',
  template,
  subscribe$: { this: ['errors'], model: ['*'] }
}, class Settings {
  constructor(elm, crInst, input, getRoot) {
    this.user = {};
    // this.setUser = () => {};
    input(this);  
    this.model = [];
    this.errors = [];
    this.rootApp = getRoot();

    api.user({ user: this.user.username ? this.user : undefined }).then(data => {
      this.model = [{ errors: [], ...data }];
      this.rootApp.user = data;
      this.rootApp.isLoggedIn = true;
    })
  }

  logout() {
    api.userLogout().then(() => {
      console.log(this.rootApp);
      this.rootApp.user = undefined;
      this.rootApp.isLoggedIn = false;
      window.location.href = '#/';
    });
  }

  submit(e, elm, item) {
    e.preventDefault();

    const data = { ...forms.getFormData(elm), id: this.user.id };
    if (!data.password) delete data.password;
    forms.toggleForm(elm, true);

    api.putSettings({ user: { ...forms.getFormData(elm), id: this.user.id } })
      .then(data => forms.toggleForm(elm, false))
      .catch(error => {
        this.errors = forms.processErrors(error); // TODO: ...
      });
  }
}));
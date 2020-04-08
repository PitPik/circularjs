require(['circular', '!settings.component.html', 'api.service'],
({ Component }, template, api) => Component({
  selector: 'settings',
  template,
  subscribe$: { this: ['errors'], model: ['*'] }
}, class Settings {
  constructor(elm, crInst, input, getRoot) {
    this.user = {};
    this.setUser = () => {};
    input(this);  
    this.model = [];
    this.errors = []; // TODO: ...

    api.user({ user: this.user.username ? this.user : undefined }).then(data => {
      this.setUser(data);
      this.model = [{ errors: [], ...data }];
    })
  }

  logout() {
    api.userLogout().then(() => {
      this.setUser(undefined);
      window.location.href = '#/';
    });
  }

  submit(e, elm, item) {
    e.preventDefault();

    const data = { ...api.getFormData(elm), id: this.user.id };
    if (!data.password) delete data.password;
    api.toggleForm(elm, true);

    api.putSettings({ user: { ...api.getFormData(elm), id: this.user.id } })
      .then(data => api.toggleForm(elm, false))
      .catch(error => {
        this.errors = api.processErrors(error); // TODO: ...
      });
  }
}));
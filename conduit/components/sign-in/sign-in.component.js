require([
  'circular',
  '!sign-in.component.html',
  'api.service',
], ({ Component }, template, api) => Component({
  selector: 'sign-in',
  template,
  subscribe$: { this: ['routeParams', 'isSignIn', 'errors', 'formDisabled'] },
}, class SignIn {
  constructor(elm, crInst, input) {
    this.routeParams = {};
    input(this);
    this.errors = [];
    this.formDisabled = false;
    this.formElm = {};
    this.isSignIn = true;// TODO: blick bug if false and textNode...
  }

  onInit(elm, crInst, inst) {
    this.formElm = inst.views.form;
  }

  this$(prop, item, value) {
    if (prop === 'isSignIn') {

    }
    if (prop === 'routeParams') {
      if ((value.appName || '').indexOf('sign-') === -1) return;
      this.isSignIn = value.appName === 'sign-in';
      this.errors = [];
      api.resetForm(this.formElm);
    }
  }

  submit(e, elm, item) {
    e.preventDefault();
    this.formDisabled = true;
    this.errors = [];

    api[this.routeParams.appName]({ user: api.getFormData(elm) }).then(data => {
      this.formDisabled = false;
      window.location.href = this.isSignIn ? '#/articles/0/my-feed' : '#/';
    }).catch(error => {
      this.formDisabled = false;
      this.errors = api.processErrors(error);
    });
  }
}));
require([
  'circular',
  '!sign-in.component.html',
  'api.service',
  'forms.service'
], ({ Component }, template, api, forms) => Component({
  selector: 'sign-in',
  template,
  subscribe$: { this: ['activeLink', 'isSignIn', 'errors', 'formDisabled'] },
}, class SignIn {
  constructor(elm, crInst, input) {
    this.activeLink = {};
    input(this);
    this.errors = [];
    this.formDisabled = false;
    this.formElm = {};
    this.isSignIn = true;
  }

  onInit(elm, crInst, inst) {
    this.formElm = inst.views.form;
    this.isSignIn = this.activeLink.link === 'sign-in'; // blick bug...
  }

  this$(prop, item, value) {
    if (prop === 'activeLink') {
      if ((value.link || '').indexOf('sign-') === -1) return;
      this.isSignIn = value.link === 'sign-in';
      this.errors = [];
      forms.resetForm(this.formElm);
    }
  }

  submit(e, elm, item) {
    e.preventDefault();
    this.formDisabled = true;
    this.errors = [];

    api[this.activeLink.link]({ user: forms.getFormData(elm) }).then(data => {
      this.formDisabled = false;
      window.location.href = this.isSignIn ? '#/articles/0/my-feed' : '#/';
    }).catch(error => {
      this.formDisabled = false;
      this.errors = forms.processErrors(error);
    });
  }
}));
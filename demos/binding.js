define('app-binding', ['circular', '!binding.html'],
({ Component }, template) => Component({
  selector: 'input-test',
  template,
  subscribe$: { this: ['value'] },
}, class Binding {
  constructor() {
    this.value = '';
  }

  input(e, elm) {
    this.value = elm.value;
  }

  clear() {
    this.value = '';
  }
}));

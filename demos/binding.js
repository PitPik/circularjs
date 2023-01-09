define('binding', ['circular', '!binding.html'], ({ Component }, template) =>

Component({
  selector: 'input-test',
  template,
},
class Binding {
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

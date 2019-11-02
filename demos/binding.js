define('app-binding', ['circular'], ({ Component, Toolbox: { $ } }) => {
  const element = $('[cr-component="input-test"]');
  const templateElm = element.removeChild(element.firstElementChild);

  Component({
    selector: 'input-test',
    template: templateElm.outerHTML,
    subscribe$: { this: ['value'] },
  }, class Binding {
    value = '';

    input(e, elm) {
      this.value = elm.value;
    }

    clear() {
      this.value = '';
    }
  }).init(element);
});

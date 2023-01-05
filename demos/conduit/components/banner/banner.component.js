require([
  'circular',
  '!banner.component.html',
], ({ Component }, template) => Component({
  selector: 'banner',
  template,
}, class Banner {
  constructor() {
    // do we need a component for this?
  }
}));
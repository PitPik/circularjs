require([
  'circular',
], ({ Component }) =>
Component({
  selector: 'demo',
  template: `
    <h2 class="{{%class}}" cr-event="click: clickMe">
      test is also working!!
    </h2>`,
  styles: `
    .test-class-foo { color: red }
    .test-class-foo-foo { color: blue }`,
  subscribe$: { this: ['class'] },
}, class Demo {
  constructor(elm, crInst, input) {
    this.class = 'test-class';
  }

  clickMe(e, elm) {
    this.class += '-foo';
  }
}));
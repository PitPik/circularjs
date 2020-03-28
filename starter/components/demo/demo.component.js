require([
  'circular',
], ({ Component }) =>
Component({
  selector: 'demo',
  template: `
    <h2 class="{{%class}}" cr-event="click: clickMe">
      test is also working!! <small>(click to change color)<small>
    </h2>`,
  styles: `
    .test-class-foo { color: red }
    .test-class-foo-foo { color: green }
    .test-class-foo-foo-foo { color: blue }`,
  subscribe$: { this: ['class'] },
}, class Demo {
  constructor(elm, crInst, input) {
    this.class = 'test-class';
  }

  clickMe(e, elm) {
    this.class += '-foo';
  }
}));
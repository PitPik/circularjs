require([
  'circular',
  '!app-starter.component.html',
  '!app-starter.component.css',
  'demo.component', // only for demo
], ({ Module }, template, styles) => 
Module({
  selector: 'app-starter',
  template,
  styles,
}, class AppStarter {
  constructor(elm, crInst, input) {
    console.log('AppStarter is working');
  }
}));
define('svgx', ['circular', '!svgx.html'], ({ Component }, template) =>

Component({
  selector: 'svg-test',
  template,
},
class Svg {
  constructor() {
    this.max = 30;
    this.r = 0;
    this.x = 0;
    this.red = 0;
  }

  onInit() {
    this.reset();
  }

  this$(prop, item, value) {
    if (prop !== 'r') return;
    this.x = value * 2;
    this.red = value * 8;
  }

  changeRadius(e, elm) {
    this.r = elm.value
  }

  reset() {
    this.r = 10;
  }
}));

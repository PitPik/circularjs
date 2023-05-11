define('svgx', ['circular', '!svgx.html'], ({ Component }, template) =>

Component({
  selector: 'svg-test',
  template,
},
class Svg {
  constructor() {
    this.max = 120;
    this.r = 0;
    this.x = 0;
    this.red = 0;
  }

  onInit() {
    this.reset();
  }

  this$(prop, item, value) {
    if (prop !== 'x') return;

    this.r = Math.floor(value / 8);
    this.red = Math.floor(value * 2 * 1.0625);
  }

  changeValue(e, elm) {
    this.x = elm.value;
  }

  reset() {
    this.x = 40;
  }
}));

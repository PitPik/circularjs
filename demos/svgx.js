define('svgx', ['circular', '!svgx.html'], ({ Component }, template) =>

Component({
  selector: 'svg-test',
  template,
},
class Svg {
  constructor() {
    this.max = 30;
    this.r = 10;
    this.x = 0;
    this.red = 0;

    this.changeValues(this.r);
  }

  changeValues(value) {
    this.x = value * 2;
    this.red = value * 8;
  }

  changeRadius(e, elm) {
    this.changeValues(this.r = elm.value);
  }
}));

define('app-home', ['circular', 'replacer', '!index.js', '!index.html', '!home.html'],
({ Component }, replacer, indexTxt, indexHTMLTxt, template) => Component({
  selector: 'app-home',
  template,
}, class Home {
  onLoad() {
    replacer('.demo', indexTxt, indexHTMLTxt);
  }
}));

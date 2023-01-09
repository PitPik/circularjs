define('index', ['circular', 'replacer', '!index.js', '!index.html', '!home.html'],
({ Component }, replacer, indexTxt, indexHTMLTxt, template) => Component({
  selector: 'home',
  template,
}, class Home {
  onLoad() {
    replacer('.demo', indexTxt, indexHTMLTxt);
  }
}));

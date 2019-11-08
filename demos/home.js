define('app-home', ['circular', 'replacer', '!index.js', '!index.html', '!home.html'],
({ Module }, replacer, indexTxt, indexHTMLTxt, template) => Module({
  selector: 'app-home',
  template,
}, class Home {
  onLoad() {
    replacer('.demo', indexTxt, indexHTMLTxt);
  }
}));

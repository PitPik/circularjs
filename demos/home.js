define('app-home', ['replacer', '!index.js', '!index.html'],
function(replacer, indexTxt, indexHTMLTxt) {
  replacer('.demo', indexTxt, indexHTMLTxt);
});

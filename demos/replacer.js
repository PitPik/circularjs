define('replacer', ['circular'], function(Circular) {
  var circular = new Circular();
  var $ = Circular.Toolbox.$;
  var body = '';

  // Quick and dirty... good enough for now though
  return function(selector, codeTxt, HTMLTxt) {
    $('code.code').innerHTML = codeTxt;
    HTMLTxt.replace(/.*?(<body[\S\s]+<\/body>.*?)/g, function(_, $1) {
      HTMLTxt = $1;
    });
    $('code.html').innerHTML = HTMLTxt;
    body = $(selector, $('code.html'));
    $('code.html').innerHTML = '';
    $('code.html').textContent = body.outerHTML.replace(/([\n\r])\s{4}/g, '$1');

    window.Prism && Prism.highlightAll();
  }
});

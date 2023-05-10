define('replacer', ['circular'], function(Circular) {
  var $ = Circular.Toolbox.$;
  var body = '';
  var parser = new DOMParser(); // to avoid svg errors...

  // Quick and dirty... good enough for now though
  return function(selector, codeTxt, HTMLTxt) {
    $('code.code').innerHTML = codeTxt.replace(/</g, '&lt;'); //.replace(/>/g, '&gt;');
    HTMLTxt.replace(/.*?(<body[\S\s]+<\/body>.*?)/g, function(_, $1) {
      HTMLTxt = $1;
    });
    if (HTMLTxt.indexOf('svg ') !== -1) {
      var out = parser.parseFromString(HTMLTxt, 'text/html');
      $('code.html').appendChild(document.adoptNode(out.documentElement.children[1].children[0]));
    } else {
      $('code.html').innerHTML = HTMLTxt;
    }
    body = $(selector, $('code.html'));
    $('code.html').innerHTML = '';
    if (body) $('code.html').textContent = body.outerHTML
      .replace(/([\n\r])\s{4}/g, '$1')
      .replace(/&gt;/g, '>');

    window.Prism && Prism.highlightAll();
  }
});

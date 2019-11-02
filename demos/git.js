define('app-git', ['circular', 'template-helpers'], ({
  Component,
  Toolbox: { $, ajax }},
  helpers,
) => {
  const elm = $('[cr-component="git-test"]'); // just being lazy
  const templateElm = elm.removeChild(elm.firstElementChild);
  const apiURL = 'https://api.github.com/repos/PitPik/circularjs/commits?per_page=3';

  ajax(apiURL, { dataType: 'json' }).then(data => Component({
    selector: 'git-test',
    template: templateElm.outerHTML,
    helpers: helpers({}),
  }, class Git { data = data }).init(elm));
});

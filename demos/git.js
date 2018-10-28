define('app-git', ['circular', 'template-helpers'], function(Circular, helpers) {
  var apiURL = 'https://api.github.com/repos/PitPik/circularjs/commits?per_page=3';
  var circular = new Circular({ helpers: helpers({}) });

  Circular.Toolbox.ajax(apiURL, { dataType: 'json' }).then(function(data) {
    circular.component('git-test', { model: data });
  });
});

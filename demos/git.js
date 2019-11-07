define('app-git', ['circular', 'template-helpers', '!git.html'],
({ Component, Toolbox: { $, ajax }}, helpers, template) => Component({
  selector: 'git-test',
  template,
  helpers: helpers({}),
}, class Git {
  data = [];
  apiURL = 'https://api.github.com/repos/PitPik/circularjs/commits?per_page=3';

  constructor() {
    ajax(this.apiURL, { dataType: 'json' }).then(data => this.data = data);
  }
}));

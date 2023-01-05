define('git', ['circular', 'template-helpers', '!git.html'],
({ Component, Toolbox: { $, ajax }}, helpers, template) =>

Component({
  selector: 'git',
  template,
  helpers: helpers({}),
},
class Git {
  constructor() {
    this.data = [];
    this.apiURL = 'https://api.github.com/repos/PitPik/circularjs/commits?per_page=3';

    ajax(this.apiURL, { dataType: 'json' }).then(data => {
      this.data = data;
    });
  }

}));

define('tree-helper', ['data-provider'], dataService => {
  const helpers = {
    hasChildren: function($1) {
      return this.getData($1 || '.').childNodes.length ? '' : 'has-no-children';
    },
    icon: function($1) {
      return dataService.getIcon(this.getData($1 || '.').kind);
    },
    isRoot: function($1) {
      return !this.getData($1 || '.').parentNode.kind;
    },
    deletable: function($1) {
      return this.getData($1 || '.').parentNode.kind ? this.getBody() : '';
    },
    this: function($1) {
      return this.getData('this')[this.getData($1)] ? this.getBody() : '';
    },
    i18n: function($1, $2, $3, $4) {
      const data = this.getData($1);
      return dataService.i18n(data !== undefined ? data : [$1, $2, $3, $4].join(' '));
    },
  };

  return (keys) => (keys || Object.keys(helpers))
    .reduce((acc, val) => (acc[val] = helpers[val], acc), {});
});

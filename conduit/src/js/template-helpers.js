define('template-helpers', [], function() {
  const dateCache = {
    short: {},
    numeric: {},
  };

  return (options) => ({
    // ----- block helpers... ----- //
    'itsme' : function($1, $2) {
      return this.getData($1) === this.getData($2) ?
        this.getBody() : this.gatAltBody();
    },
    'my-comment': function($1, $2) {
      return this.getData($1) === this.getData($2) ? this.getBody() : '';
    },
    // ----- inline helpers... ----- //
    'simple-date': function($1, $2) { // too slow, so we cache
      const date = this.getData($1);
      const options = {
        year: 'numeric',
        month: 'long',
        day: $2 === 'short' ? undefined : 'numeric',
      };
      const type = options.day || 'short';
      const key = date.substr(0, 10);

      dateCache[type][key] = dateCache[type][key] || new Date(date)
        .toLocaleDateString(undefined, options); // this is really slow...

      return dateCache[type][key];
    },
    'markdown': function($1) {
      return options.markdown(this.getData($1).trim());
    },
  });
});

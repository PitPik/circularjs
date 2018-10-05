define('template-helpers', [], function() {
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
    'simple-date': function($1, $2) {
      const options = {
        year: 'numeric',
        month: 'long',
        day: $2 === 'short' ? undefined : 'numeric',
      };

      return  new Date(this.getData($1))
        .toLocaleDateString(undefined, options);
    },
    'markdown': function($1) {
      return options.markdown(this.getData($1).trim());
    },
  });
});
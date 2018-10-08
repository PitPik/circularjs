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
    // 'simple-date': function($1, $2) { // too slow
    //   const options = {
    //     year: 'numeric',
    //     month: 'long',
    //     day: $2 === 'short' ? undefined : 'numeric',
    //   };

    //   return  new Date(this.getData($1))
    //     .toLocaleDateString(undefined, options);
    // },
    'simple-date': function($1, $2) {
      const date = new Date(this.getData($1));
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      const day = date.getDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      return `${monthNames[monthIndex]} ${day}, ${year}`;
    },
    'markdown': function($1) {
      return options.markdown(this.getData($1).trim());
    },
  });
});
define('template-helpers', [], function() {
  'use strict';

  return (options) => ({
    // ----- block helpers... ----- //
    // ----- inline helpers... ----- //
    'simple-date': function($1, $2) {
      const options = {
        year: 'numeric',
        month: 'long',
        day: $2 === 'short' ? undefined : 'numeric',
      };

      return new Date($1)
        .toLocaleDateString(undefined, options);
    },
    slice: function($1, $2, $3) {
      return $1.substring($2, $3);
    }
  });
});
  require.config({
    lookaheadMap: {
      'app-home': ['circular', '!index.js', '!index.html'],
    },
    paths: {
      'replacer': 'demos/replacer',
      '!index.js': 'demos/index.js',
      // '!index.html': 'demos/!index.html',
      '!binding.js': 'demos/binding.js',
      '!binding.html': 'demos/binding.html',
      '!tree.js': 'demos/tree.js',
      '!tree.html': 'demos/tree.html',
    },
  });

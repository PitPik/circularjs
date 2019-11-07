  require.config({
    lookaheadMap: {
      'app-home': ['circular', '!index.js', '!index.html'],
      'app-git': ['circular', 'template-helpers'],
    },
    paths: {
      'template-helpers': 'demos/helpers',
      'replacer': 'demos/replacer',
      '!index.js': 'demos/index.js',
      // '!index.html': 'demos/!index.html',
      '!binding.js': 'demos/binding.js',
      '!binding.html': 'demos/binding.html',
      '!tree.js': 'demos/tree.js',
      '!tree.html': 'demos/tree.html',
      '!git.html': 'demos/git.html',
      '!git.js': 'demos/git.js',
      '!index.html': 'index.html',
      '!home.html': 'demos/home.html',
      'app-git': 'demos/git',
      'app-home': 'demos/home',
      'app-tree': 'demos/tree',
      'app-binding': 'demos/binding',
    },
  });

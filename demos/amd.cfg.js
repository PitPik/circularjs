  require.config({
    baseUrl: 'demos',
    lookaheadMap: {
      'index': ['circular', 'replacer', '!index.js', '!index.html', '!home.html'],
      'git': ['circular', 'template-helpers'],
      'tree': ['circular', '!tree.html'],
      'binding': ['circular', '!binding.html'],
      'home': ['circular', 'index'],
    },
    paths: {
      'template-helpers': 'helpers',
      'replacer': 'replacer',
      '!index.js': 'index.js',
      '!index.html': '../index.html',
      '!binding.js': 'binding.js',
      '!binding.html': 'binding.html',
      '!tree.js': 'tree.js',
      '!tree.html': 'tree.html',
      '!git.html': 'git.html',
      '!git.js': 'git.js',
      '!home.html': 'home.html',
      'git': 'git',
      'index': 'home',
      'tree': 'tree',
      'binding': 'binding',
      'home': 'index'
    },
  });

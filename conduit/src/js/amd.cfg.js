require.config({
  lookaheadMap: {
    // 'app-articles': ['article-preview'],
    // 'app-profile': ['article-preview'],
  },
  paths: {
    '!ui-components': 'templates/ui-components.html',
    'template-helpers': 'js/template-helpers',

    'app-data.srv': 'js/app-data.srv',
    'form-helper': 'js/form-helper',
    'article-preview': 'js/article-preview',
    'marked': 'js/vendor/marked',
    'animate': 'js/vendor/animate',
  },
  options: {
    minifyPrefix: '.min'
  }
});

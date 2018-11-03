require.config({
  lookaheadMap: {
    'app-articles': ['article-preview'],
    'app-article': ['app-data.srv'],
    'app-editor': ['app-data.srv', 'form-helper'],
    'app-login': ['app-data.srv', 'form-helper'],
    'app-profile': ['article-preview', 'app-data.srv'],
    'app-settings': ['app-data.srv', 'form-helper'],
  },
  paths: {
    '!ui-components': 'templates/ui-components.html',
    'template-helpers': 'js/template-helpers',

    'app-data.srv': 'js/app-data.srv',
    'form-helper': 'js/form-helper',
    'article-preview': 'js/article-preview',
    'marked': 'js/vendor/marked',
    'app-articles': 'modules/articles/index',
    'app-article': 'modules/article/index',
    'app-editor': 'modules/editor/index',
    'app-settings': 'modules/settings/index',
    'app-profile': 'modules/profile/index',
    'app-login': 'modules/login/index',
  }
});

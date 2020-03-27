require.config({
  lookaheadMap: {
    // this section is only if you need to go faster with loading while devloping
    'app-starter.component': ['!app-starter.component.html', '!app-starter.component.css'],
  },
  paths: {
    'app-starter.component': 'components/app-starter/app-starter.component',
    '!app-starter.component.html': 'components/app-starter/app-starter.component.html',
    '!app-starter.component.css': 'components/app-starter/app-starter.component.css',
    'demo.component': 'components/demo/demo.component',
  }
});
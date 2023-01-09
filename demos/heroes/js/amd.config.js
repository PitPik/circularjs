require.config({
	lookaheadMap: {
		'app-dashboard': ['circular', '!modules/dashboard/css/index.css', 'data-provider', 'app-search'],
		'app-search': ['circular', 'data-provider'],
		'app-detail': ['circular', '!modules/detail/css/index.css', 'data-provider'],
		'app-heroes': ['circular', '!modules/heroes/css/index.css', 'data-provider'],
		'data-provider': ['toolbox'],
	},
	paths: {
		'data-provider': 'shared-modules/data-provider-mock',
		'app-dashboard': 'modules/dashboard/js/dashboard',
		'app-search': 'modules/dashboard/js/search',
		'app-heroes': 'modules/heroes/js/heroes',
		'app-detail': 'modules/detail/js/detail'
	},
	production: {
		// 'data-provider': 'shared-modules/data-provider',
	}
});
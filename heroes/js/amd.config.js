require = window.require || {
	lookaheadMap: {
		'app-dashboard': ['circular', 'data-provider', 'data-search'],
		'app-search': ['circular', 'data-provider'],
		'app-detail': ['circular', 'data-provider'],
		'app-heroes': ['circular', 'data-provider'],
		'data-provider': ['toolbox'],
	},
	paths: {
		'data-provider': 'shared-modules/data-provider',
		'app-dashboard': 'modules/dashboard/js/dashboard',
		'app-search': 'modules/dashboard/js/search',
		'app-heroes': 'modules/heroes/js/heroes',
		'app-detail': 'modules/detail/js/detail'
	}
};
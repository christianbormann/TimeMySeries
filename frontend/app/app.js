angular
.module('app', ['ui.router', 'ui.bootstrap', 'ui-notification'])
.config(['$urlRouterProvider', '$stateProvider', '$httpProvider', function($urlRouterProvider, $stateProvider, $httpProvider) {

	/* Routing */
	$urlRouterProvider.otherwise('/series');
	$stateProvider
		.state('series', {
			url: '/series',
			templateUrl: 'app/components/series/series.html',
			controller: 'seriesController'			
		})
		
		.state('timer', {
			url: '/timer',
			templateUrl: 'app/components/timer/timer.html',
			controller: 'timerController'
		})

		 .state('services', {
			url: '/services',
			templateUrl: 'app/components/services/services.html',
			controller: 'servicesController'
		})

		.state('events', {
			url: '/events/:seriesName/:fromSeason',
			templateUrl: 'app/components/events/events.html',
			controller: 'eventsController'
		});
 

}])
 
angular
	.module('app')
	.controller('timerController', function ($scope, $http, $location, Notification) {

	$http.get('api/timer/list').
		then(function(response) {
			if (response.data.message == "ok") {
				$scope.timer = response.data.timer;
			} else {

			}
	});

});
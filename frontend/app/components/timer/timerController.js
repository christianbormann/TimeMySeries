angular
	.module('app')
	.controller('timerController', function ($scope, $http, $location, Notification) {
	
	function getTimerList() {
		$http.get('api/timer/list').
			then(function(response) {
				if (response.data.message == "ok") {
					$scope.timer = response.data.timer;
				} else {

				}
		});
	}
	getTimerList();

	 $scope.timerdelete = function(timer) {
		$http.post('api/timer/delete', {"timer": timer}).
		then(function(response) {
			if (response.data.code == 0) {
				Notification.success(response.data.message);
				getTimerList();
			} else {
				Notification.error(response.data.message);
			}
		}, function(response) {

		});
	}

});
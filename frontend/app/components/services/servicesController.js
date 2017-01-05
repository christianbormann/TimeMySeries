angular
	.module('app')
	.controller('servicesController', function ($scope, $http, $location, Notification) {
	
	function getServicesList() {
		$http.get('api/services/list').
			then(function(response) {
				if (response.data.message == "ok") {
					$scope.services = response.data.services;
				} else {

				}
		});
	}
	getServicesList();

	$scope.toogleServiceStatus = function(id) {
		$http.post('api/services/' + id).
		then(function(response) {
			if (response.data.message == "ok") {
				Notification.success('Sender erfolgreich ge&auml;ndert.');
				getServicesList();
			} else {
				Notification.error('Sender konnten nicht ge&auml;ndert werden.');
			}
		}, function(response) {

		});
	}

});
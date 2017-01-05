angular
	.module('app')
	.controller('seriesController', function ($scope, $http, $stateParams, Notification) {
	
	$scope.epgnames = [];
	$scope.series = null;

	function getSeriesList() {
		$http.get('api/series/list').
			then(function(response) {
				if (response.data.message == "ok") {
					$scope.series = response.data.series;
				} else {

				}
		});
	}
	getSeriesList();

	$scope.getEPGNames = function(filter) {
		if (filter.length > 2) {
			return $http.get('api/series/searchnames/' + filter).
			then(function(response) {
				if (response.data.message == "ok") {					
					return response.data.names.map(function(item) {
						console.log(item);
						return item;
					});
				} else {

				}
			});
		}
	}

	$scope.addSeries = function() {
		if ($scope.series == null) {
			$scope.series = [];
		}
		var newseriesitem = {};
		newseriesitem.id = "n";
		newseriesitem.name = "";
		newseriesitem.fromseason = 1;
		$scope.series.push(newseriesitem);		
	}

	$scope.saveSeries = function() {
		$http.post('api/series/save', {"series": $scope.series}).
		then(function(response) {
			if (response.data.message == "ok") {
				Notification.success('Serien erfolgreich gespeichert.');
				getSeriesList();
			} else {
				Notification.error('Serien konnten nicht gespeichert werden.');
			}
		}, function(response) {

		});
	}

});

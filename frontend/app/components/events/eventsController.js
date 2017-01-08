angular
	.module('app')
	.controller('eventsController', function ($scope, $http, $location, Notification, $stateParams, $state) {

        if (($stateParams.seriesName != "") && ($stateParams.fromSeason != "")){
            $http.get('api/events/' + $stateParams.seriesName + '/' + $stateParams.fromSeason).
            then(function(response) {
                if (response.data.message == "ok") {
                    $scope.events = response.data.events;
                } else {
 
                }
            });
        }

        $scope.showallservices = false;
        $scope.showallseasons = false;

        $scope.showEventFilterServices = function(event) {
            if ($scope.showallservices == true) {
                return true;
            }
            else {
                if (event.allowedservice == true) {
                    return true;
                }
                else {
                    return false;
                }

            }
        }

        $scope.showEventFilterSeasons = function(event) {
            if ($scope.showallseasons == true) {
                return true;
            }
            else {
                if (event.allowedseason == true) {
                    return true;
                }
                else {
                    return false;
                }

            }
        }

        $scope.timeradd = function(event) {
            $http.post('api/timer/add', {"event": event}).
            then(function(response) {
                if (response.data.code == 0) {
                    Notification.success(response.data.message);
                } else {
                    Notification.error(response.data.message);
                }
            }, function(response) {

            });
        }

    })
    .filter('orderObjectBy', function(){
        return function(input, attribute) {
            if (!angular.isObject(input)) return input;

            var array = [];
            for(var objectKey in input) {
                array.push(input[objectKey]);
            }

            array.sort(function(a, b){
                a = parseInt(a[attribute]);
                b = parseInt(b[attribute]);
                return a - b;
            });
            return array;
        }
    })
    .filter('customNumber', function(){
        return function(input, size) {
            var zero = (size ? size : 4) - input.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + input;
        }
    });



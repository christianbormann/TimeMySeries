angular
	.module('app')
	.controller('eventsController', function ($scope, $http, $location, Notification, $stateParams, $state) {

        if ($stateParams.seriesName != "") {
            
            $http.get('api/events/' + $stateParams.seriesName).
            then(function(response) {
                if (response.data.message == "ok") {
                    $scope.events = response.data.events;
                } else {

                }
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

angular
	.module('app')
  .directive('navigation', [ '$state', function($state) {
    return {
        restrict: 'E',
        templateUrl: 'app/shared/navigation/navigation.html',
        link: function($scope, $element, $attributes, controller) {
        }
    };
}]);

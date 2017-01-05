/* global angular */

(function () {
	'use strict';

	var forEach = angular.forEach,
		isObject = angular.isObject;

	angular.module('ui-router-history', ['ui.router'])
	.factory('$stateHistory', ['$rootScope', '$state', '$q', function ($rootScope, $state, $q) {
		function getItemIndex (item) {
			return _history_.indexOf(item);
		}

		var _history_ = [];
		var _isHistoryLocked_ = false;

		var $stateHistory = {
			setLastState: function setLastState (st) {
				_history_.unshift(st);
			},

			getLastState: function getLastState () {
				return _history_.length > 0 ? _history_[0] : false;
			},

			hasLastState: function hasLastState () {
				var lastSt = this.getLastState();

				if(lastSt && lastSt.state && lastSt.state.name === '') {
					// clear the history
					this.clear();

					lastSt = this.getLastState();
				}

				return (lastSt && lastSt.state && lastSt.state.name !== '');
			},

			lockHistory: function () {
				_isHistoryLocked_ = true;
			},

			unlockHistory: function () {
				_isHistoryLocked_ = false;
			},

			isHistoryLocked: function () {
				return _isHistoryLocked_;
			},

			/**
			 * @name $stateHistory#getItem
			 * @description
			 * Get an item from history by name
			 */
			getItem: function (stateName) {
				var state;
				forEach(_history_, function (item) {
					if(item.state.name === stateName) {
						state = item;
					}
				});
				return state;
			},

			/**
			 * @name $stateHistory#removeItem
			 *
			 * @description
			 * Remove state by name
			 */
			removeItem: function (stateName) {
				var item = this.getItem(stateName);

				if(!item) {
					return false;
				}

				var index = getItemIndex(item);

				_history_.splice(index, 1);

				return true;
			},

			removeLastItem: function () {
				var lastItem = this.getLastState();

				return this.removeItem(lastItem.state.name);
			},

			/**
			 * @name $stateHistory#back
			 *
			 * @description
			 * Back to the last state of the history
			 */
			back: function () {
				var self = this;

				if(!this.isHistoryLocked()) {
					this.lockHistory();
				}

				var lastState = this.getLastState();
				return $state.go(lastState.state.name, lastState.params).then(function () {
					_history_.splice(_history_.indexOf(lastState), 1);

					self.unlockHistory();
				});
			},

			/**
			 * @name $stateHistory#clear
			 *
			 * @description
			 * Clear the entire history list
			 */
			clear: function () {
				_history_ = [];
			},

			/**
			 * @name $stateHistory#getHistory
			 *
			 * @description
			 * Retrieve the history list
			 */
			getHistory: function () {
				return _history_;
			}
		};

		return $stateHistory;
	}])
	.run(['$rootScope', '$stateHistory', function ($rootScope, $stateHistory) {
		$rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
			if($stateHistory.isHistoryLocked()) {
				return $stateHistory.unlockHistory();
			}

			if (!fromState.abstract) {
				$stateHistory.setLastState({
					state: fromState,
					params: fromParams
				});
			}
		});
	}]);
})();

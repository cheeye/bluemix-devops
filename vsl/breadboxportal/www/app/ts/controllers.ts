/// <reference path="ShoppingList/List.ts" />
/// <reference path="ShoppingList/Suggestion.ts" />
/// <reference path="../../../typings/angularjs/angular.d.ts" />
var app = angular.module("breadbox.controllers", []);
app.controller("shoppinglist", function($scope, $http, $ionicPopup, Items, Suggestions, ListManager, User, APP_CONFIG) {
	$scope.id = User.username;
	$scope.rev = '';
	$scope.visibility = "none";
	$scope.hasRecommended = true;
	$scope.removeButton = document.getElementById("removeButton");
	$scope.suggestions = [];

	$scope.addItem = function() {
		var box: HTMLInputElement = <HTMLInputElement> document.getElementById("addInput");
		if (box.value) {
			var item: ShoppingList.Item = new ShoppingList.Item(null, box.value);
			box.value = "";
			$scope.list.add(item);
		}
		$scope.visibility = "none";
		$scope.removeButton.style.visibility = "visible";
		ListManager.uploadList($scope.id, $scope.list);
	};

	$scope.addRecommended = function(suggested: ShoppingList.Suggestion) {
		var i = $scope.suggestions.indexOf(suggested);
		$scope.suggestions.splice(i, 1);
		$scope.list.items.unshift(new ShoppingList.Item(null, suggested.name));
		if ($scope.suggestions.length === 0) {
			$scope.hasRecommended = false;
		}
		ListManager.uploadList($scope.id, $scope.list);
	}

	//Called when user swipes left on an item.Removes the item from the list.
	$scope.removeItem = function(item: ShoppingList.Item, $event) {
		$scope.list.remove(item);
		if ($scope.list.count() < 1) {
			$scope.visibility = "none";
		}
		ListManager.uploadList($scope.id, $scope.list);
	};

	$scope.removeChecked = function() {
		$scope.list.removeChecked();
		if ($scope.list.count() < 1) {
			$scope.visibility = "none";
		}
		else {
			$scope.hideDelete();
		}
		ListManager.uploadList($scope.id, $scope.list);
	};

	$scope.removeAll = function() {
		$scope.removeAllConfirm();
	};

	//Handles the checkbox being tapped.
	$scope.checked = function(item: ShoppingList.Item) {
		item.decoration = item.getDecoration();
		ListManager.uploadList($scope.id, $scope.list);
	};

	$scope.removeAllConfirm = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: 'Remove all items.',
			template: 'Are you sure you want to remove all items from the list?',
			buttons: [
				{ text: 'No' }, { text: "Yes", type: "button-assertive", onTap: function() { return true; } }]
		});
		confirmPopup.then(function(res) {
			if (res) {
				$scope.list.removeAll();
				Items.clear();
				ListManager.uploadList($scope.id, $scope.list);
				$scope.visibility = "none";
			} else {
			}
		});
	};

	$scope.removeButtonClick = function() {
		$scope.visibility = "inline-block";
		$scope.removeButton.style.visibility = "collapse";
	};

	$scope.hideDelete = function($event) {
		$scope.visibility = "none";
		$scope.removeButton.style.visibility = "visible";
		var addInput = document.getElementById("addInput");
	}

	$scope.downloadSuggestions = function() {
		$http.get(APP_CONFIG.listService + "/recommendationList")
			.success(function(data, status, headers, config) {
				var arr = data["recom"];
				for (var i = 0; i < arr.length; i++) {
					var sugg = new ShoppingList.Suggestion(arr[i].id, arr[i].name, arr[i].reason);
					if (!$scope.list.contains(sugg.name)) {
						Suggestions.add(sugg);
					}
				}
				$scope.suggestions = Suggestions.topFiltered($scope.list);
			})
			.error(function(data, status, headers, config) {
				console.log("Error getting suggestions");
			});
	}

	$scope.updateList = function() {
		$scope.list = new ShoppingList.List(Items.all());
	}

	$scope.updateList();
	$scope.downloadSuggestions(); //Move to service.

});

app.controller("personal", function($scope, $state, Items, ListManager, User) {
	$scope.name = User.realname;
	$scope.points = User.breadpoints;

	$scope.go = function(where) {
		$state.go(where);
	}

	ListManager.downloadList(User.username, $scope.updateList);
});

app.controller("employee", function($scope, $state, User, Items, ListManager) {
	$scope.name = User.realname;
	$scope.points = User.breadpoints;

	ListManager.downloadList(User.username, $scope.updateList);
});

app.controller("login", function($scope, $state, $ionicLoading, $ionicHistory, $ionicPopup, $http, User, APP_CONFIG) {
	$scope.registering = false;
	$scope.loading = false;
	$scope.submitText = "Submit";
	$scope.registerText = "Need an account? Register now!";

	$scope.setUser = function(data) {
		User.username = data["_id"];
		User.realname = data["realname"];
		User.customerid = data["customerid"];
		User.breadpoints = data["breadpoints"];
		$scope.loading = false;
	};

	$scope.getUser = function() {
		var url = APP_CONFIG.listService + "/userDetail";
		$scope.loading = true;
		$ionicLoading.show({ template: 'Logging in ...' });
		$http.get(url)
			.success(function(data, status, headers, config) {
				$ionicLoading.hide();
				$scope.setUser(data);
				$state.go("employee");
			})
			.error(function(data, status, headers, config) {
				$ionicLoading.hide();
				$scope.showAlert("Failed to login", "Please try again later.");
				$scope.loading = false;
			});
	};

	$scope.showAlert = function(messTitle, message) {
		$scope.buttonDisabled = true;
		var alertPopup = $ionicPopup.alert({
			title: messTitle,
			template: message
		});
		alertPopup.then(function(res) {
			$scope.buttonDisabled = false;
		});
	};

	$scope.getUser();
});

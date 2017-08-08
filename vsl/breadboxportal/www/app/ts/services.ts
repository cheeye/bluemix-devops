/// <reference path="ShoppingList/List.ts" />
/// <reference path="ShoppingList/Suggestion.ts" />
/// <reference path="../../../typings/angularjs/angular.d.ts" />
import Suggestion = ShoppingList.Suggestion;
import List = ShoppingList.List;
var app = angular.module("breadbox.services", []);

app.factory('Items', function() {
	var items: ShoppingList.Item[] = [];
	return {
		all: function() {
			return items;
		},
		save: function(list) {
			items = list;
		},
		createAndSave: function(arr: any[]) {
			var list: List = new List(arr);
			items = list.getItems();
        },
		clear: function() {
			items = [];
		}
	};
})
	.factory('Suggestions', function() {
		var suggestions: Suggestion[] = [];
		return {
			all: function(): Suggestion[] {
				return suggestions;
			},
			top: function(): Suggestion[] {
				return suggestions.slice(0, 2);
			},
			add: function(element) {
				suggestions.push(element);
			},
			topFiltered: function(items: ShoppingList.List): Suggestion[] {
				var arr = [];
				for (var i = 0; i < suggestions.length && arr.length < 2; i++) {
					if (!items.contains(suggestions[i].name)) {
						arr.push(suggestions[i]);
					}
				}
				return arr;
			}
		};
	});

app.service('User', function() {
	this.realname = "null";
	this.username = ""
	this.breadpoints = 0;
	this.customerid = 0;
})

app.service('ListManager', function($http, Items, APP_CONFIG) {
	this.downloadList = function(id, callback) {
		console.log("id: " + id);
		$http.get(APP_CONFIG.listService + "/shoppingList")
			.success(function(data, status, headers, config) {
				Items.createAndSave(data["list"]);
				List.rev = data["_rev"];
				if (callback) {
					callback();
				}
			})
			.error(function(data, status, headers, config) {
				console.log(status + " - error getting shopping list");
			});
	};

	this.compress = function(list) {
		Items.save(list);
		var arr = Items.all()["items"];
		var arr2 = [];
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].compress) {
				arr2.push(arr[i].compress());
			}
		}
		return arr2;
	};

	this.uploadList = function(id, list) {
		console.log(id + "  " + List.rev);
		var arr = this.compress(list);
		var opt = {
			url: APP_CONFIG.listService + "/shoppingList",
			body: { _rev: List.rev, list: arr }
		};
		console.log("LOG:" + JSON.stringify(opt.body));
		$http.put(opt.url, opt.body)
			.success(function(data, status, headers, config) {
				if (data["rev"]) {
					List.rev = data["rev"];
				}
			})
			.error(function(data, status, headers, config) {
				console.log("error getting list." + status + " , " + data);
			});
	};

});

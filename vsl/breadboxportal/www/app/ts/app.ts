/// <reference path="../../../typings/angularjs/angular.d.ts" />
angular.module('breadbox', ['ionic', 'breadbox.controllers', 'breadbox.services'])
  .run(function($ionicPlatform, $http) {

  // Get the JWT from the parent window and set the default HTTP auth header
  var search = window.parent.location.search;
  search = search.substring(1);
  var params = search.split("&");
  var token;
  params.forEach(function(item){
    if (item.indexOf("access_token=") === 0) {

      token = item.substring(13);
    }
  });
  if (token) {

    $http.defaults.headers.common.Authorization = "Bearer " + token;
  }

    $ionicPlatform.ready(function() {
    });
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('shoppinglist', {
      url: '/shoppinglist',
      cache: false,
      templateUrl: 'shopping.html',
      controller: "shoppinglist"
    })
      .state('employee', {
        cache: false,
        url: '/employee',
        templateUrl: 'employee.html',
        controller: "employee"
      })
      .state('login', {
        url: '/login',
        templateUrl: 'login.html',
        controller: "login"
      })
      .state('po-login', {
        cache: false,
        url: '/pologin',
        templateUrl: 'pologin.html',
        controller: 'POLoginController'
      })
      .state('purchase-orders', {
        url: '/purchase-orders',
        templateUrl: 'polist.html',
        controller: 'POListController',
        cache: false
      })
      .state('purchase-orders-details', {
        cache: false,
        url: '/purchase-orders/:POID',
        templateUrl: 'podetail.html',
        controller: 'PODetailController'
      });
    $urlRouterProvider.otherwise('/login');
  });

angular.element(document).ready(function () {

	var initInjector = angular.injector(['ng']);
	var $http = initInjector.get('$http');
	$http.get('config/APP_CONFIG.json').then(
			function (response) {

				angular.module('breadbox').constant("APP_CONFIG", response.data);
				angular.bootstrap(angular.element(document).find('body'), ['breadbox']);
			});
});

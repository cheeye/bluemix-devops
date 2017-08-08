angular.module('breadbox.controllers')

.controller('POListController', function($scope, $state, $ionicLoading,
  $timeout, POService) {
  'use strict';

  $scope.POs = [];
  $scope.POsApproved = [];

  $scope.loading = true;
  //Show the loading icon and then go fetch the list
  $timeout(function() {
    $scope.POsApproved = POService.approvedPOs;
    POService.getPOs().then(
      function(data) {
        $scope.POs = data.POs;
        $scope.loading = false;
        if ($scope.POs.length === 0) {
          $scope.emptyApproval = true;
        }
      },
      function() {
        $scope.loading = false;
        if ($scope.POs.length === 0) {
          $scope.emptyApproval = true;
        }
      }
    );
  }, 1000);
})

.controller('PODetailController', function($scope, $state, $stateParams,
  $ionicLoading, $ionicPopup, $timeout, POService) {
  'use strict';

  $scope.showApproving = function() {
    $ionicLoading.show({
      template: 'Approving...'
    });
  };

  $scope.showApproved = function() {
    var confirmPopup = $ionicPopup.show({
      template: '<p style="text-align:center">Approved!</p>',
      buttons: [{
        text: 'OK',
        type: 'button-positive'
      }]

    });
    return confirmPopup;
  };

  $scope.approve = function(PO) {
    $scope.showApproving();
    POService.approve(PO.id).then(
      function() {
        $scope.hide($ionicLoading);
        $scope.showApproved().then(
          function() {
            $state.transitionTo('purchase-orders', {}, {
              reload: true,
              inherit: true,
              notify: true
            });
          }
        );
      },
      function() {
        console.log('Failed to approve');
        $scope.hide($ionicLoading);
      });
  };

  $scope.showLoading = function() {
    $ionicLoading.show({
      template: 'Loading...'
    });
  };

  $scope.hide = function() {
    $ionicLoading.hide();
  };
  $scope.PO = null;
  $scope.isApproved = true;

  $scope.showLoading($ionicLoading);

  //Show the loading icon and then go fetch the item
  $timeout(function() {
    POService.getPO($stateParams.POID).then(
      function(po) {
        $scope.PO = po;
        $scope.isApproved = po.approved;
        $scope.hide($ionicLoading);
      },
      function() {
        $scope.hide($ionicLoading);
      });
  }, 1000);
});

angular.module('breadbox.services')

.factory('POService', function($http, $log,
  $q, APP_CONFIG) {
  'use strict';

  var poService = {

    POs: null,
    approvedPOs: [],

    getPOs: function() {
      var deferred = $q.defer();
      $http.get(APP_CONFIG.poService + '/purchase-orders')
        .success(function(data) {
          console.log('retrieved po data: ');
          console.log(data);
          poService.POs = data.POs;
          deferred.resolve(data);
        })
        .error(function(data, status) {
          console.log('error retrieving po data: ');
          console.log(data, status);
          deferred.reject({
            POs: []
          });
        });

      return deferred.promise;
    },

    getPO: function(POID) {

      if (poService.POs === null) {
        return poService.getPOs().then(function() {
          return poService.getPO(POID);
        });
      }
      var deferred = $q.defer();
      var found = false;
      for (var i = 0; i < poService.POs.length; i++) {
        if (poService.POs[i].id === POID) {
          deferred.resolve(poService.POs[i]);
          found = true;
          break;
        }
      }
      if (!found) {
        for (i = 0; i < poService.approvedPOs.length; i++) {
          if (poService.approvedPOs[i].id === POID) {
            deferred.resolve(poService.approvedPOs[i]);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        deferred.reject('not found');
      }
      return deferred.promise;
    },

    approve: function(POID) {
      var deferred = $q.defer();
      $http.put(APP_CONFIG.poService + '/purchase-orders/' + POID, {
          approved: true
        })
        .success(function(data) {
          console.log('Successfully approved' + POID);
          poService.getPO(POID).then(function(po) {
            po.approved = true;
            poService.approvedPOs.push(po);
            deferred.resolve(data);
          });
        })
        .error(function() {
          deferred.reject('Failed');
        });

      return deferred.promise;
    }
  };
  return poService;
});

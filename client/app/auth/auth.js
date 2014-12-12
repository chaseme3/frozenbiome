angular.module('waffle.auth', [])

.controller('AuthController', function ($scope, $location, $rootScope, Auth) {


	$scope.login = function() {
		if (!$scope.username || !$scope.password) {
			alert('Username and password required!')
			return;
		}
		Auth.login($scope.username, $scope.password)
		.then(function(data){
			$rootScope.loggedIn = true;
			$rootScope.user = $scope.username;
			$rootScope.userId = data.data;
			console.log($rootScope.userId);
			Auth.saveUser($scope.username);
			$location.path('/');
			//TODO redirect to dashboard
		}, function(err) {
			alert(err.data)
			$scope.username = '';
			$scope.password = '';
		})
	}

	$scope.signup = function() {
		if (!$scope.username || !$scope.password || !$scope.newDisplayName) {
			alert('All fields required!')
		}
		if ($scope.password !== $scope.passwordMatch) {
			alert('Passwords do not match!');
			return;
		}
		Auth.signup($scope.username, $scope.password, $scope.newDisplayName)
		.then(function(data){
			$rootScope.loggedIn = true;
			$rootScope.user = $scope.username;
			$rootScope.displayName = $scope.newDisplayName;
			$location.path('/');
		}, function(err) {
			alert(err.data)
			$scope.username = '';
			$scope.password = '';
			$scope.passwordMatch = '';
			$scope.newDisplayName = '';
		})
	}

	$scope.logout = function() {
		Auth.logout();
		$rootScope.loggedIn = false;
		$rootScope.user = '';
	}
 
})
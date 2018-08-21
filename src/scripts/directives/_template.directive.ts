(() => {
    angular.module('appDirective', [])
        .directive('appDirective', [(): any => {
            return {
                restrict: 'AE',
                replace: true,
                transclude: false,
                scope: {

                },
                templateUrl: '/ngTemplates/template.html',
                controller: ['$scope',
                    ($scope: any) => {
                        $scope.message = "I'm a directive with typescript compiled by gulp";
                    },
                ],
            };
        }]);
})();

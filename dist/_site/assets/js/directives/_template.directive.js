(function () {
    angular.module('appDirective', [])
        .directive('appDirective', [function () {
            return {
                restrict: 'AE',
                replace: true,
                transclude: false,
                scope: {},
                templateUrl: '/ngTemplates/template.html',
                controller: ['$scope',
                    function ($scope) {
                        $scope.message = "I'm a directive with typescript compiled by gulp";
                    },
                ]
            };
        }]);
})();

//# sourceMappingURL=../maps/directives/_template.directive.js.map

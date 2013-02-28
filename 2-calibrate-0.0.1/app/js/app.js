var app = angular.module('calibrateApp', [
    'dangle'
]);


app.factory('LeapMotion', function() {
    return {
        play : false,

        controller: null,

        //Use because lack of Object Observation or Dirty Checking.
        //state: {
            valid: false,
            timestamp: 0,
            fingersCount: 0,
            frame: null,
            indexFinger: {
                valid: false,
                position: {x:0, y:0, z:0},
                velocity: {
                    length: 0,
                    x:0, y:0, z:0
                },
                //use Aitken's delta-squared process for calculation acceleration
                acceleration: {
                    length: 0,
                    x:0, y:0, z:0
                }
            },
        //},

        getController: function() {
            if(this.controller == null) {
                this.controller = new Leap.Controller();
                var self = this;

                var seriesAccelerationMethodForX = new SimpleAccelerationProcess();
                var seriesAccelerationMethodForY = new SimpleAccelerationProcess();
                var seriesAccelerationMethodForZ = new SimpleAccelerationProcess();

                this.controller.on('animationFrame', function() {
                    var frame = self.controller.frame();
                    self.frame = frame;
                    self.fingersCount = frame.pointables.length;
                    var pointable = getNearestPointable(frame);
                    self.valid = frame.valid;
                    if (pointable) {
                        self.timestamp = frame.timestamp;
                        self.indexFinger.valid = true;

                        self.indexFinger.position.x = pointable.tipPosition[0];
                        self.indexFinger.position.y = pointable.tipPosition[1];
                        self.indexFinger.position.z = pointable.tipPosition[2];

                        self.indexFinger.velocity.x = pointable.tipVelocity[0];
                        self.indexFinger.velocity.y = pointable.tipVelocity[1];
                        self.indexFinger.velocity.z = pointable.tipVelocity[2];
                        self.indexFinger.velocity.length = vectorLength(pointable.tipVelocity[0], pointable.tipVelocity[1], pointable.tipVelocity[2]);

                        var accelX = seriesAccelerationMethodForX.forNewPosition(frame.timestamp, pointable.tipPosition[0], pointable.tipVelocity[0])
                        var accelY = seriesAccelerationMethodForY.forNewPosition(frame.timestamp, pointable.tipPosition[1], pointable.tipVelocity[1])
                        var accelZ = seriesAccelerationMethodForZ.forNewPosition(frame.timestamp, pointable.tipPosition[2], pointable.tipVelocity[2])
                        self.indexFinger.acceleration.x = accelX;
                        self.indexFinger.acceleration.y = accelY;
                        self.indexFinger.acceleration.z = accelZ;
                        self.indexFinger.acceleration.length = vectorLength(accelX, accelY, accelZ);
                    } else {
                        self.indexFinger.valid = false;
                        seriesAccelerationMethodForX.invalidate();
                    }
                });
            }
            return this.controller;
        },

        start: function() {
            if (this.play) {
                return;
            }
            this.play = true;
            this.getController().connect();
        },

        stop: function() {
            this.play = false;
            this.getController().disconnect();
            //Doesn't implement in js library
            //this.getController().
        }
    }
});

function vectorLength(dx, dy, dz) {
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Z is point to user so, nearest pointable to screen with less Z.
 * @param frame
 * @return {*}
 */
function getNearestPointable(frame) {
    var nearestPoinable = null;
    var zDistance = -Number.MAX_VALUE;
    var pointables = frame.pointables;
    for(var index = pointables.length - 1; index >=0; index--){
        var pointable = pointables[index];
        if(pointable == null || !pointable.valid){
            continue;
        }

        var position = pointable.tipPosition;
        var newZDistance = position[2];
        if(zDistance < newZDistance){
            zDistance = newZDistance;
            nearestPoinable = pointable;
        }
    }

    return nearestPoinable;
}

/*
Implement more accurate method
 http://en.wikipedia.org/wiki/Aitken%27s_delta-squared_process

 FIX : use timestamp for calculation
*/

var AitkensDeltaSquaredProcess = function(){
    var valid = false;
    var previous1 = {
        timestamp: 0,
        value: 0
    }

    var previous2 = {};

    this.forNewPosition = function(timestamp, value, deltaValue) {
        var result;
        if(valid) {
            result = (value * previous2.value - previous1.value * previous1.value ) / (value - 2 * previous1.value + previous2.value );
        } else {
            previous2.timestamp = previous1.timestamp;
            previous2.value = previous1.value;

            previous1.timestamp = timestamp;
            previous1.value = value;

            valid = previous2.timestamp != 0;

            result = 0;
        }

        return result;
    }

    this.invalidate = function() {
        valid = false;
        previous1.timestamp = 0;
    }
};

var SimpleAccelerationProcess = function() {
    var valid = false;
    var previous = {
        timestamp: 0,
        deltaValue: 0
    }

    this.forNewPosition = function(timestamp, value, deltaValue) {
        var result;
        if(valid) {
            result = (deltaValue - previous.deltaValue) / (timestamp - previous.timestamp);
        } else {
            result = 0;
            valid = true;
        }

        previous.timestamp = timestamp;
        previous.deltaValue = deltaValue;
        return result;
    }

    this.invalidate = function() {
        valid = false;
    }
}

function WindowPositionCtrl($scope, $timeout) {
    $scope.window = {x:0, y:0};

    $timeout(updateWindowPosition, 100);

    function updateWindowPosition() {
        $scope.window.x = window.screenX;
        $scope.window.y = window.screenY;
        $timeout(updateWindowPosition, 100);
    }
}

function LeapCursorCtrl($scope, LeapMotion) {
    LeapMotion.start();
    $scope.indexFingerPosition = LeapMotion.indexFinger.position;
}

function LeapPositionCtrl($scope, LeapMotion) {
    LeapMotion.start();

    $scope.disconnect = function() {
        LeapMotion.stop();
    }
    $scope.leap = LeapMotion;
}


function DynamicsGraphicCtrl($scope) {
    $scope.dynamics = {
        data : []
        /*data: {
            entries:[]
        }*/
    };

    $scope.filterByDate = function() {
        console.log('$scope.filterByDate', arguments);
    }

    var index = 1000;
    while(--index>=0) {
        $scope.dynamics.data.push(10*Math.random());
        //$scope.dynamics.data.entries.push(10*Math.random());
    }
}

/*

PieChart Directive from http://insight-dashboard.herokuapp.com

    insightDashboardApp.directive("pieChart", function () {
        var a = d3.scale.category20c();
        return{restrict:"E", scope:{data:"=", width:"=", height:"="}, link:function (c, d, e) {
            var f = +c.width || 400, g = +c.height || 400, h = Math.min(f, g) / 2, i = c.data, j = d3.svg.arc().outerRadius(h - 10).innerRadius(0), k = d3.svg.arc().outerRadius(j.outerRadius()), l = d3.layout.pie().sort(null).value(function (a) {
                return a[1]
            }), m = d3.select(d[0]).append("svg").attr("class", "pie-chart").attr("width", f).attr("height", g + 50).append("g").attr("transform", "translate(" + f / 2 + "," + (g / 2 + 25) + ")");
            c.$watch("data", function (b) {
                var c = m.selectAll(".arc").data(l(b)).enter().append("g").attr("class", "arc");
                c.append("path").attr("d", j).style("fill", function (b) {
                    return a(b.data[0])
                }), c.append("text").style("text-anchor", "middle").text(function (a) {
                    return a.data[0]
                }).attr("dy", ".35em").attr("transform", function (a) {
                        return a.innerRadius = h + 50, a.outerRadius = h, "translate(" + k.centroid(a) + ")"
                    })
            })
        }}
    });*/

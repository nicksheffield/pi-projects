var Gpio = require('onoff').Gpio
var _ = require('lodash')

var leds = [
	new Gpio(17, 'out'),
	new Gpio(27, 'out'),
	new Gpio(22, 'out')
]

process.on('SIGINT', function() {
    console.log('closing')

    _.each(leds, function(led) {
	led.unexport()
    })
	
    process.exit()
})

// led.writeSync(1)

var c = 0
setInterval(function(){
    _.each(leds, function(led) {
        led.writeSync(0)
    })

    leds[c].writeSync(1)

    c++
    if(c == leds.length) {
        c = 0
    }
}, 100)


// -------------

var pinA = new Gpio(16, 'out')
var pinB = new Gpio(20, 'out')



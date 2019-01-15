/* ------------------------------------ */
/* Dependencies */
/* ------------------------------------ */
var Gpio       = require('onoff').Gpio
var _          = require('lodash')
var io         = require('socket.io')()
var express    = require('express')

/* ------------------------------------ */
/* Web Server */
/* ------------------------------------ */
var app = express()

app.use(express.static('./public'))
app.listen(8000)
io.listen(9000)

io.on('connection', function(socket) {
	console.log('client connected', socket.id)
})

/* ------------------------------------ */
/* Variables */
/* ------------------------------------ */
var leds = [
	new Gpio(17, 'out'),
	new Gpio(27, 'out'),
	new Gpio(22, 'out')
]

var interupt = 'rising';
var ldr = new Gpio(5, 'in', interupt)

// ldr.setEdge('none')
// ldr.setDirection('out')
// ldr.writeSync(1)

// flush any voltage in the capacitor
clearCapacitor()

var lastTime = new Date().valueOf()

function check(err, state) {
	if(err) console.log('err', err)
	
	clearCapacitor()

	var now = new Date().valueOf()
	var d = now - lastTime
	lastTime = now
	
	// console.log(d)
	
	if(between(d, 115, 130)) {
		console.log('dark', d)
		io.emit('output', {
			message: 'dark'
		})
	// } else if(between(d, 115, 120)) {
	// 	console.log('shade', d)
	// 	io.emit('output', {
	// 		message: 'shade'
	// 	})
	} else if(between(d, 100, 115)){
		console.log('bright', d)
		io.emit('output', {
			message: 'bright'
		})
	} else if(d >= 130) {
		console.log('high-spike', d)
		// io.emit('output', {
		// 	message: 'high-spike'
		// })
	} else if(d <= 100) {
		console.log('low-spike', d)
		// io.emit('output', {
		// 	message: 'low-spike'
		// })
	} else {
		console.log('spooky', d)
		// io.emit('output', {
		// 	message: 'spooky'
		// })
	}
}
// ldr.watch(check)

function clearCapacitor() {
	ldr.unwatch(check)
	ldr.setEdge('none')
	ldr.setDirection('out')
	ldr.writeSync(0)
	
	// this shouldn't be the way
	setTimeout(function() {
		ldr.setDirection('in')
		ldr.setEdge(interupt)
		ldr.watch(check)
	}, 100)
}

function between(n, min, max) {
	return n >= min && n < max
}


// function check(pin) {
// 	var measurement = 0;
	
// 	/*
// 		# Discharge capacitor
// 		GPIO.setup(PiPin, GPIO.OUT)
// 		GPIO.output(PiPin, GPIO.LOW)
// 		time.sleep(0.1)
// 	*/
	
// 	ldr.setEdge('none')
// 	ldr.setDirection('out')
// 	ldr.writeSync(0)
// 	ldr.setDirection('in')
// 	ldr.setEdge(interupt)
	
	
// 	/*
// 		GPIO.setup(PiPin, GPIO.IN)
// 		# Count loops until voltage across
// 		# capacitor reads high on GPIO
// 		while (GPIO.input(PiPin) == GPIO.LOW):
// 		  measurement += 1

// 		return measurement
// 	*/
// }





/* ------------------------------------ */
/* Clean up */
/* ------------------------------------ */
process.on('SIGINT', function() {
	console.log('closing')
	
	_.each(leds, function(led) {
		led.unexport()
	})
	
	ldr.unexport()
	
	process.exit()
})

process.on('uncaughtException', function(err) {
	console.log(err);
})

console.log('Up and running')

_.each(leds, function(led) {
	led.writeSync(1)
})

setTimeout(function() {
	_.each(leds, function(led) {
		led.writeSync(0)
	})
}, 100)
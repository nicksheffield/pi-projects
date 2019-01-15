/* ------------------------------------ */
/* Dependencies */
/* ------------------------------------ */
var Gpio       = require('onoff').Gpio
var express    = require('express')
var morgan     = require('morgan')
var bodyParser = require('body-parser')
var io         = require('socket.io')(8001)
var _          = require('lodash')
	
/* ------------------------------------ */
/* Variables */
/* ------------------------------------ */
var leds = [
	new Gpio(17, 'out'),
	new Gpio(27, 'out'),
	new Gpio(22, 'out')
]
var app = express()
var timer = null
var current = 0
var direction = 1 // either 1 or -1

/* ------------------------------------ */
/* Clean up */
/* ------------------------------------ */
process.on('SIGINT', function() {
	console.log('closing')
	
	_.each(leds, function(led) {
		led.unexport()
	})
	
	process.exit()
})

/* ------------------------------------ */
/* Express & Middleware */
/* ------------------------------------ */
app.listen(8000)
app.use(morgan('tiny'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname+'/public'))

/* ------------------------------------ */
/* Routes */
/* ------------------------------------ */

app.get('/stop', function(req, res) {
	clearInterval(timer)
	timer = null
	_.each(leds, function(led) {
		led.writeSync(0)
	})
	res.redirect('/')
})

/* ------------------------------------ */
/* Socket.io */
/* ------------------------------------ */
io.on('connection', function(socket) {
	console.log('socket: ', socket.id)
	
	blink(0, 2)
	
	socket.emit('welcome', 'yo!')
	
	socket.on('change', function(speed) {
		speed = parseInt(speed)
		
		_.each(leds, function(led) {
			led.writeSync(0)
		})
		
		io.emit('update', speed)
		
		current = 0
		clearInterval(timer)
		timer = setInterval(swap, speed)
	})
	
	socket.on('reverse', function() {
		direction *= -1
	})
	
	socket.on('morseCode', function(data) {
		console.log('morseCode', data.message)
		
		// Stop timer loop, reset to low
		clearInterval(timer)
		timer = null
		_.each(leds, function(led) {
			led.writeSync(0)
		})
	})
	
	socket.on('down', function() {
		clearInterval(timer)
		timer = null
		
		
		
		_.each(leds, function(led) {
			led.writeSync(1)
		})
	})
	
	socket.on('up', function() {
		_.each(leds, function(led) {
			led.writeSync(0)
		})
	})
})

/* ------------------------------------ */
/* Timer Function */
/* ------------------------------------ */
function swap() {
	_.each(leds, function(led) {
		led.writeSync(0)
	})
	
	leds[current].writeSync(1)
	
	if(current != (direction === 1 ? leds.length - 1 : 0)){
		current += direction
	} else {
		current = (direction === 1 ? 0 : leds.length - 1)
	}
}

function blink(n, max) {
	if(n == max) return;
	
	if(n == undefined) n = 0
	_.each(leds, function(led) {
		led.writeSync(1)
	})
	
	setTimeout(function() {
		_.each(leds, function(led) {
			led.writeSync(0)
		})
		
		setTimeout(function() {
			blink(n+=1, max)
		}, 50)
	}, 50)
}

/* ------------------------------------ */
/* Report */
/* ------------------------------------ */
console.log('Pi Express running on port 8000, choo choo!')
/* ------------------------------------ */
/* Dependencies */
/* ------------------------------------ */
var Gpio        = require('onoff').Gpio
var express     = require('express')
var morgan      = require('morgan')
var bodyParser  = require('body-parser')
var _           = require('lodash')

/* ------------------------------------ */
/* Variables */
/* ------------------------------------ */
var app         = express()
var timer       = null
var unit        = 100
var dot         = unit * 1
var dash        = unit * 3
var partSpace   = unit * 1
var letterSpace = unit * 3
var wordSpace   = unit * 7

var leds = [
	new Gpio(17, 'out'),
	new Gpio(27, 'out'),
	new Gpio(22, 'out')
]
var emittingLeds = [
	leds[0],
	leds[1],
	leds[2],
]
var morse = {
	a: '.-',
	b: '-...',
	c: '-.-.',
	d: '-..',
	e: '.',
	f: '..-.',
	g: '--.',
	h: '....',
	i: '..',
	j: '.---',
	k: '-.-',
	l: '.-..',
	m: '--',
	n: '-.',
	o: '---',
	p: '.--.',
	q: '--.-',
	r: '.-.',
	s: '...',
	t: '-',
	u: '..-',
	v: '...-',
	w: '.--',
	x: '-..-',
	y: '-.--',
	z: '--..',
	1: '.----',
	2: '..---',
	3: '...--',
	4: '....-',
	5: '.....',
	6: '-....',
	7: '--...',
	8: '---..',
	9: '----.',
	0: '-----',
}

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
app.use(express.static(__dirname + '/public'))

app.post('/message', function(req, res) {
	console.log(req.body.message)
	
	emitMorseCode(req.body.message)
	
	res.redirect('/')
})

console.log('server running on port 8000')

/* ------------------------------------ */
/* Morse code */
/* ------------------------------------ */
function emitMorseCode(msg) {
	var letters = []
	var queue = []
	
	for(var i = 0; i < msg.length; i++) {
		if(msg[i] == ' ') {
			letters.push(' ')
		} else {
			letters.push(morse[msg[i].toLowerCase()])
		}
	}
	
	console.log('letters', letters)
	
	_.each(letters, function(letter) {
		if(letter == ' ') {
			queue.push(0)
			queue.push(wordSpace)
			return
		}
		
		letter = letter.split('')
		
		console.log('letter', letter)
		
		_.each(letter, function(piece) {
			console.log('piece', piece)
			if(piece == '.') {
				queue.push(dot)
			} else {
				queue.push(dash)
			}
			
			queue.push(partSpace)
		})
		
		queue.push(0)
		queue.push(letterSpace)
	})
	
	function emitLetter(queue, i) {
		if(!i) i = 0
		if(queue[i] == undefined) return
			
		_.each(emittingLeds, function(led) {
			if(queue[i]) led.writeSync(1)
		})
	
		setTimeout(function() {
			_.each(emittingLeds, function(led) {
				led.writeSync(0)
			})
			
			setTimeout(function() {
				emitLetter(queue, i+2)
			}, queue[i+1])
		
		}, queue[i])
	}

	emitLetter(queue)
}
/*
	todo:
	. v0.1
		- multi tonality
		- smooth transitions     .........single-phase wave generation NO
*/

var r = new require('stream').Readable(),
	Speaker = require('speaker'),
	Frequency = require('./classes/Frequency.js'),
	Voice = require('./classes/Voice.js'),
	fs = require('fs'),
	loop_ticks = 0,
	setImmediate_buffer_time = 2,
	settings = {
		freqs: [400, 500, 800, 900, 1200, 1600],
		bitDepth: 16,
		channels: 2,
		sampleRate: 44100,
		sampleSize:0,
		blockAlign:0,
		amplitude:0,
		volume: 1,
		max_voices: 8
	},
	voices = [],
	time = {
		startTime: new Date(),
		last_tick: Date.now(),
		last_processing_time: 0,
		lag: 0,
		tick: 1000 / 20,
		samplesGenerated: 0,
		time:0,
		one:0
	},
	generators = {
		sine_wave: function (){
			var vibrado = 0;
			if(!!this.vibrado_depth && !!this.vibrado_freq){
				vibrado = this.vibrado_depth * Math.sin(Math.PI * this.vibrado_freq * time.time);
			}
			return this.volume * Math.sin(2 * Math.PI * (this.frequency.freq + vibrado) * time.time)
		}
	},
//this object is visible to the application. all the wavegen crap is privately available in its closure but only these methods and props are accessable via the instance.
	wavegen = {
		settings: settings, 
		time: time, 
		start: start_wavegen,
		debug: false,
		voices: voices,
		add_voice: add_voice,
		rm_voice: rm_voice,
		get_voice: get_voice,
		generators: generators
	};

module.exports = (function(){
	settings.sampleSize = settings.bitDepth / 8;
	settings.blockAlign = settings.sampleSize * settings.channels;
	settings.amplitude = settings.bitDepth > 8 ? 32760 : 127;
	r._read = function(){};
	r.pipe(new Speaker());
	
	add_voice(generators.sine_wave, {volume: 0, freq: 1})//MUST HAVE 1 OR PRGRM CRSHZ

	return wavegen;
}());

function add_voice(fn, opts){
	if(voices.length > (settings.max_voices - 1)){
		voices[v] = null;
		voices.shift();
	}
	voices[voices.length] = new Voice(fn, opts);
}
function rm_voice(id){
	for(var v in voices){
		if(voices[v].id === id){
			voices[v] = null;
			voices.splice(v,1);
		}
	}
}
function get_voice(id){
	if(typeof id === 'string'){id = parseInt(id)}
	for(var v in voices){
		if(voices[v].id === id){
			return voices[v]
		}
	}
	return false;
}


function update(delta){
	time.sample_time = time.samplesGenerated / settings.sampleRate;
	if(delta > time.tick){debug('tick lag: '+ (delta - time.tick));}
	if(!!this.samples){this.push(this.samples)}
	var numSamples = Math.ceil(settings.sampleRate / (1000/delta));
	time.sample_time_increment = delta / numSamples;
	this.samples = generate_amplitude_data.call(this, numSamples);
}


var wave_meta = {
	last_point:0,
	phases:0,
	last_freq: 0,
	last_freq_change:0
}
function generate_amplitude_data(numSamples){
	var buf = new Buffer(numSamples * settings.blockAlign);

	//console.log(wave_meta.phases, 20 * wave_meta.phases)
	wave_meta.phases = 0;

	//kinda works of you update the freq here. pretty choppy though
	for(var v in voices){
		voices[v].frequency.update(time.samplesGenerated / settings.sampleRate);
	}


	for (var i = 0; i < numSamples; i++) {
		time.time = (time.samplesGenerated + i) / (settings.sampleRate);
		time.one = time.time - Math.floor(time.time)

		// A sin(2π f t + φ) : the sine wave formula
		var amp = (settings.volume * settings.amplitude),
			voice_data = (function(){
				data = 0;
				for(var v in voices){data += voices[v].math_engine();}
				return data;
			}()),
			point = Math.round((amp / voices.length) * voice_data );
		

		/*if (wave_meta.last_point < 0 && point >= 0){
			wave_meta.phases++;
			console.log(frequency.freq)
			frequency.update(time.time - wave_meta.last_freq_change);
			time.samplesGenerated = 0;
			wave_meta.last_freq_change = time.time;
		}*/

		wave_meta.last_point = point;

		for (var channel = 0; channel < settings.channels; channel++) {
			var offset = (i * settings.sampleSize * settings.channels) + (channel * settings.sampleSize);
			buf['writeInt' + settings.bitDepth + (settings.bitDepth > 8 ? 'LE' : '')](point, offset);
		}
	}
	
	time.samplesGenerated += numSamples;
	return buf;
}

function start_wavegen(){
	update_loop(update.bind(r));
	return this; //for method chaining
}
function debug(msg){
	if(wavegen.debug){
		if(Array.isArray(msg) && !!msg.join && msg.length > 1){
			msg = msg.join(' | ');
		}
		console.log(msg);
	}
}
function update_loop(fn) {
	var now = Date.now();

	//loop_ticks++;
	if (time.last_tick + time.tick <= now) {
		var delta = (now - time.last_tick);
		time.last_tick = now;
		//console.log('delta', delta, '(target: ' + tick +'ms)', 'loop ticks', loop_ticks);
		loop_ticks = 0;

		fn(delta);
	}

	if (Date.now() - time.last_tick < time.tick - setImmediate_buffer_time) {
		setTimeout(arguments.callee.bind(this, fn));
	} else {
		setImmediate(arguments.callee.bind(this, fn));
	}
}
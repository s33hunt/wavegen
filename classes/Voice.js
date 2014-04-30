var Frequency = require('./Frequency.js')

module.exports = Voice;

function Voice (fn, opts){
	if(!(this instanceof Voice)){
		return new Vioce (fn, opts);
	}

	if(typeof fn === 'function'){
		this.math_engine = fn.bind(this);
	}else{
		throw new Error ('no data generator function')
	}

	this.frequency = new Frequency({
		slide_time: opts.slide_time || .5, 
		sample_rate: 44100, 
		freq: opts.freq || 400
	});
	this.id = typeof(opts.id) === 'string' ? parseInt(opts.id) : null;
	this.volume = opts.volume !== undefined ? opts.volume : 1;
	this.vibrado_depth = opts.vibrado_depth !== undefined ? opts.vibrado_depth : 0;
	this.vibrado_freq = opts.vibrado_freq !== undefined ? opts.vibrado_freq : 0;
}
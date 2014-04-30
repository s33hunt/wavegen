module.exports = Frequency;

function Frequency(settings){
	if (!(this instanceof Frequency)) return new Frequency(settings);

	this.interpolation_modes = {};
	this.freq = settings.freq || 400;
	this.prev_freq = this.freq;
	this.slide_time = !!settings.slide_time ? settings.slide_time : .5;
	this.sample_rate = !!settings.sample_rate ? settings.sample_rate : 44100;
	this.time_increment = this.slide_time / this.sample_rate;
	this.progress = 0;
	this.slide_start = 0;

	var temp = ['lerp', 'slerp'];
	for(var m in temp){
		Object.defineProperty(this.interpolation_modes, temp[m], {
			value:temp[m],
			writable:false,
			enumerable:true
		});
	}
	Object.defineProperties(this, {
		'_interpolation_mode':{
			value: 'lerp',
			enumerable: false,
			writable: true
		},
		'interpolation_mode': {
			enumerable: true,
			get: function(){return this._interpolation_mode},
			set: function(v){ if(!!this.interpolation_modes[v]) this._interpolation_mode = v; }
		},
		'_target_freq':{
			value: 0,
			enumerable: false,
			writable:true
		},
		'target_freq': {
			enumerable: true,
			get: function(){return this._target_freq},
			set: function (v){
				if(v != this._target_freq) {
					this.prev_freq = this.freq;
					this._target_freq = v;
				}
			}
		}
	});

	this.target_freq = this.freq;
}

Frequency.prototype.update = function(t){
	if(this.target_freq !== this.freq && this.target_freq !== this.prev_freq) {
		this.progress += t;
		this.freq = this[this.interpolation_mode](this.prev_freq, this.target_freq, this.progress);
	}else{
		this.progress = 0;
		this.slide_start = t;
	}
	if(this.progress > .9)console.log(this.progress)
}

Frequency.prototype.slerp = function(a,b,t){
	if(arguments.length < 3) return;
	if(t > 1){
		t = 1;
		this.progress = 1;
		this.freq = this.target_freq;
	}
	if(t < 0){
		t = 0;
		this.progress = 0;
	}
	var val = a + ( (b - a) * (.5*(1 - Math.cos(Math.PI * t ) ) ) );
	return val;
	//return (((-.5*Math.cos(Math.PI*t))-.5)*(a-b))+a;
}

Frequency.prototype.lerp = function(a,b,t){
	if(arguments.length < 3) return;
	if(t > 1){
		t = 1;
		this.progress = 1;
		this.freq = this.target_freq;
	}
	if(t < 0){
		t = 0;
		this.progress = 0;
	}
	return a+((b-a) * t);
}
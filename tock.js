/**
* Tock by Mr Chimp - github.com/mrchimp/tock
* Based on code by James Edwards:
*    sitepoint.com/creating-accurate-timers-in-javascript/
*/

/**
* Modified by Firebrand for use in `password`: https://github.com/FirebrandCoding/password
*/

/**
* Called every tick for countdown clocks.
* i.e. once every this.interval ms
*/
function _tick () {
	
	this.time += this.interval;
	
	if (this.countdown && this.duration - this.time < 0) {
		
		this.timeEnded = 0;
		this.continue = false;
		
		this.callback(this);
		
		clearTimeout(this.timeout);
		
		this.complete(this);
		
		return;
		
	} else {
		
		this.callback(this);
		
	}
	
	var diff              = _delta(this.timeStarted) - this.time,
		untilNextInterval = Math.max(this.interval - diff, this.interval);
	
	if (untilNextInterval <= 0) {
		
		this.ticksMissed = Math.floor(Math.abs(untilNextInterval) / this.interval);
		this.time       += this.ticksMissed * this.interval;
		
		if (this.continue) this._tick();
		
	} else if (this.continue) {
		
		this.timeout = setTimeout(this._tick.bind(this), untilNextInterval);
		
	};
	
};

function _delta (source) { return Date.now() - source };

/**
* Called by Tock internally - use start() instead
*/
function _startCountdown (duration) {
	
	this.duration    = duration;
	this.timeStarted = Date.now();
	this.time        = 0;
	
	this.continue    = true;
	
	this._tick();
	
	
}

/**
* Called by Tock internally - use start() instead
*/
function _startTimer (offset) {
	
	this.timeStarted = offset || Date.now();
	this.time        = 0;
	
	this.continue    = true;
	
	this._tick();
	
}

var Tock = function (options) {
	
	let defaults = {
		
		continue:  false,
		countdown: false,
		
		timeout:     null,
		ticksMissed: null,
		
		interval: 100,
		
		time:       0,
		timeStart:  0,
		timePause:  0,
		timeFinal:  0,
		
		duration:   0,
		
		callback () {},
		complete () {}
		
	};

	let result = Object.assign(defaults, options);
	
	Object.assign(this, result);
	
	if (!this instanceof Tock) return new Tock(options);
	
};

Tock.prototype._tick           = _tick;
Tock.prototype._startCountdown = _startCountdown;
Tock.prototype._startTimer     = _startTimer;
Tock.prototype._delta          = _delta;

/**
* Reset the clock
*/
Tock.prototype.reset = function () {
	
	if (this.countdown) return false;
	
	this.stop();
	this.timeStarted = this.time = 0;
	
};

/**
* Start the clock.
* @param {Various} time Accepts a single "time" argument in ms
*/
Tock.prototype.start = function (time = 0) {
	
	if (this.continue) return false;
	
	this.timeStarted = time;
	this.timePaused  = 0;
	
	this.countdown
			? this._startCountdown(time)
			: this._startTimer(_delta(time));
	
};

/**
* Stop the clock and clear the timeout
*/
Tock.prototype.stop = function () {
	
	this.timePaused = this.left();
	this.continue   = false;
	
	clearTimeout(this.timeout);
	
	this.timeEnded = this.countdown
							? this.duration - this.time
							: _delta(this.timeStarted);
	
};

/**
* Stop/start the clock.
*/
Tock.prototype.pause = function () {
	
	if (this.continue) {
		
		this.timePaused = this.left();
		this.stop();
		
		return;
		
	};
	
	if (this.timePaused) {
		
		this.countdown
			? this._startCountdown(this.timePaused)
			: this._startTimer(_delta(this.timePaused));
		
		this.timePaused = 0;
		
	}
	
};

/**
* Get the current clock time in ms.
* Use with Tock.msToTime() to make it look nice.
* @return {Integer} Number of milliseconds ellapsed/remaining
*/
Tock.prototype.left = function () {
	
	if (!this.continue) return this.timePaused || this.timeEnded;
	
	let now  = _delta(this.timeStarted),
		left = this.countdown ? this.duration - now : now;
	
	return left;
	
};
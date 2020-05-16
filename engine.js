let $playfield = document.querySelector(".playfield"),
	$score     = document.querySelector(".score"),
	$countdown = document.querySelector(".countdown"),

	$screen    = {

		start: document.querySelector(".start")

	};

let Password = {

	current: [],

	type: isMobile(navigator).any ? "order" : "keyboard",

	alphabet: [

		"0", "1", "2", "3", "4", "5", "6", "7",
		"8", "9", "A", "B", "C", "D", "E", "F",
		"G", "H", "J", "K", "M", "N", "P", "Q",
		"R", "S", "T", "V", "W", "X", "Y", "Z"

	],

	solved () { return Password.current.every(cell => cell.solved) },

	generate: {

		keyboard () {

			let used = Password.alphabet
									.map(key => key.toLowerCase())
									.slice(0, Game.difficulty.length)
									.shuffle(),

				cells = [...document.querySelectorAll("main kbd")];

			Password.current = used.map((key, index) => { return {

				key,
				element: cells[index],
				solved:  false

			} });

		},

		order () {

			Password.current = Array.through(Game.difficulty.length, 1).shuffle();

		}

	}

};

let Game = {

	status: "initial",

	timer: null,

	difficulty: {

		time:   5,
		length: 8,

		set: {

			time   (value) { Game.difficulty.time   = value },
			length (value) { Game.difficulty.length = value }

		}

	},

	score: {

		current: 0,

		highest: 0,

		countup: null,

		add (value) {
			
			Game.score.current += value;

			DOMNegotiator.score();

		},

		reset () {
			
			Game.score.current = 0;
		
			DOMNegotiator.score();

		}
	},

	tick       () {

		let elapsed    = Game.timer.left(),
			total      = Game.difficulty.time.ms(),

			percentage = (elapsed / total) * 100,
			
			width      = Math.max(percentage, 0);

		$countdown.style.width = `${width}%`;

	},

	initialize () {

		Game.timer = new Tock({

			countdown: true,
			interval:  16,

			callback: Game.tick,
			complete: Game.lose

		});

		Game.score.countup = new CountUp($score, 0, {
			
			duration: 1,
			
			separator: " "
		
		});

	},

	resolve    () {

		KeyHandler._pressed = [];

		Password.generate[Password.type]();

		DOMNegotiator.reset();

		DOMNegotiator.render();

		Game.timer.time.base
					? Game.timer.restart()
					: Game.timer.start(Game.difficulty.time.ms());
	
		Game.status = "ongoing";

	},

	lose       () {

		$playfield.classList.add("failed");

		Game.status = "lost";

	},

	succeed    () {

		let score = Game.difficulty.length / Game.difficulty.time * 20;

		Game.score.add(score);

		Game.resolve();

	},

	start      () {

		Game.score.reset();

		Game.resolve();

		$screen.start && $screen.start.classList.add("hidden");

	},

	pause      () {

		Game.timer.pause();

		$playfield.classList.add("paused");

		Game.status = "paused";

	},

	unpause    () {

		Game.timer.unpause();

		$playfield.classList.remove("paused");

		Game.status = "ongoing";

	},

	foul       () {

		// * penalty == (<time_in_ms> / 10) == (<time_in_s> * 100)
		let penalty = Game.difficulty.time * 100;

		Game.timer.reduce(penalty);

		$playfield.classList.add("foul");

		window.setTimeout(() => $playfield.classList.remove("foul"), 125);

	},

	settings   () {},

	load       () {},
	
	save       () {}

};

let KeyHandler = {

	_pressed:  [],

	_special:  {

		" " () {

			let handler = {

				"initial": Game.start,
				"lost":    Game.start,

				"ongoing": Game.pause,
				"paused":  Game.unpause

			};

			handler[Game.status]();

		},

		"Control": Game.settings,
		"Meta":    Game.settings,

		"Shift" () { /* noop */ },
		"Alt"   () { /* noop */ }

	},

	keydown (event) {

		let key = event.key;

		if (key.belongsTo(KeyHandler._map) && Game.status == "ongoing") {

			let cell = Password.current.find(cell => cell.key == key);

			cell.solved = true;

			if (Password.solved()) {

				Game.succeed();

				return;
			
			};

			KeyHandler._pressed.last = key;

			DOMNegotiator.negotiate(cell);

		} else if (key.belongsTo(KeyHandler._special.pipe(Object.keys))) {

			KeyHandler._special[key]();

		} else if (Game.status == "ongoing") {

			Game.foul();

		}

	},

	keyup   (event) {

		let key = event.key;

		if (key.belongsTo(KeyHandler._map)) {

			let cell = Password.current.find(cell => cell.key == key);
		
			KeyHandler._pressed.remove(key);

			DOMNegotiator.negotiate(cell);
		
		};

	}

};

let DOMNegotiator = {

	render () {
		
		for (cell of Password.current) cell.element.querySelector("span").textContent = cell.key;

	},

	reset () {

		for (cell of Password.current) cell.element.classList.remove("solved");

		$playfield.classList.remove("failed");
			
	},

	score () {

		if (Game.score.current) $score.classList.add("visible");

		Game.score.countup.update(Game.score.current);

	},

	negotiate (cell) {

		let pressed = cell.key.belongsTo(KeyHandler._pressed);

		if (pressed) {

			cell.element.classList.add("pressed");

			cell.solved
				? cell.element.classList.add("solved")
				: cell.element.classList.remove("solved");

		} else {

			cell.element.classList.remove("pressed");

		};

	}

};

let events = [

	{ type: "keydown", 			handler: KeyHandler.keydown },
	{ type: "keyup", 			handler: KeyHandler.keyup   },

	{ type: "DOMContentLoaded", handler: Game.initialize    },

	{ type: "beforeunload", 	handler: Game.save 		    }

];

for ({type, handler} of events) document.addEventListener(type, handler);
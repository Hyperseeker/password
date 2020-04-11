let $main      = document.querySelector("main"),
	$score     = document.querySelector(".score"),
	$countdown = document.querySelector(".countdown"),

	$menu = {

		start: document.querySelector(".menu.start")

	};

let Password = {

	current: [],

	length: 8,

	alphabet: [
		"0", "1", "2", "3", "4", "5", "6", "7",
		"8", "9", "A", "B", "C", "D", "E", "F",
		"G", "H", "J", "K", "M", "N", "P", "Q",
		"R", "S", "T", "V", "W", "X", "Y", "Z"
	],

	solved () { return Password.current.every(cell => cell.solved) },

	generate () {

		Password.current = [];

		let left = Password.length,
			used = [],

			cells = [...document.querySelectorAll("main .cell")],

			pick = function () {

				let key = Password.alphabet.pick();

				while (key.belongsTo(used)) key = Password.alphabet.pick();
	
				used.last = key;

				return key;

			};
		
		while (left) Password.current.last = {
			
			key:     pick(),
			element: cells[Password.length - left--],
			solved:  false
		
		};

		KeyHandler._map = used;

	}

};

let Game = {

	status: "initial",

	timer: null,

	difficulty: 5000,

	score: {

		current: 0,

		highest: 0,

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
			total      = Game.difficulty,

			percentage = (elapsed / total) * 100,
			
			width      = Math.max(percentage, 0);

		$countdown.style.width = `${width}%`;

	},

	initialize () {

		let options = {

			countdown: true,
			interval:  16,

			callback: Game.tick,
			complete: Game.lose

		};

		Game.timer = new Tock(options);
	
	},

	resolve    () {

		Game.status = "ongoing";

		Password.generate();

		DOMNegotiator.reset();

		DOMNegotiator.render();

		Game.timer.time.base
					? Game.timer.restart()
					: Game.timer.start(Game.difficulty);

	},

	lose       () {

		Game.status = "lost";

		$main.classList.add("failed");

	},

	succeed    () {

		let score = Password.length / (Game.difficulty / 1000) * 20;

		Game.score.add(score);

		Game.resolve();

	},

	start      () {

		if (Game.status != "initial" && Game.status != "lost") return;

		Game.score.reset();

		Game.resolve();

		$menu.start && $menu.start.remove();

	},

	foul       () {

		let penalty = Game.difficulty / 10;

		Game.timer.reduce(penalty);

	},

	settings   () {},

	load       () {},
	
	save       () {}

};

let KeyHandler = {

	_pressed:  [],
	_map:      [],

	_special:  [

		" ",

		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",

		"Ctrl",
		"Meta"

	],

	keydown (event) {

		let key = event.key.toUpperCase();

		if (key.belongsTo(KeyHandler._map) && Game.status == "ongoing") {

			let cell = Password.current.find(cell => cell.key == key);

			cell.solved = true;

			if (Password.solved()) {

				KeyHandler._pressed = [];
				
				Game.succeed();

				return;
			
			};

			KeyHandler._pressed.last = key;

			DOMNegotiator.negotiate(cell);

		} else if (key.belongsTo(KeyHandler._special)) {

			let handler = {

				   " ": Game.start,

				"Ctrl": Game.settings,
				"Meta": Game.settings

			};

			handler[key]();

		} else {

			Game.foul();

		}

	},

	keyup   (event) {

		let key = event.key.toUpperCase();

		if (key.belongsTo(KeyHandler._map)) {

			let cell = Password.current.find(cell => cell.key == key);
		
			KeyHandler._pressed.remove(key);

			DOMNegotiator.negotiate(cell);
		
		};

	}

};

let DOMNegotiator = {

	render () {
		
		for (cell of Password.current) cell.element.textContent = cell.key;

	},

	reset () {

		for (cell of Password.current) cell.element.classList.remove("solved");

		$main.classList.remove("failed");
			
	},

	score () {

		$score.textContent = Game.score.current;

		if (Game.score.current) $score.classList.add("visible");

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
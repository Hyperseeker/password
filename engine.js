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

	}

};

let Game = {

	status: "initial",

	timer: null,

	difficulty: 5000,

	score: {

		current: 0,

		_adjust () {
			
			$score.textContent = Game.score.current;

			if (Game.score.current) $score.classList.add("visible");
		
		},

		add (value) {
			
			Game.score.current += value;

			Game.score._adjust();
		
		},

		reset () {
			
			Game.score.current = 0;
		
			Game.score._adjust();

		}
	},

	tick () {

		let elapsed    = Game.timer.left(),
			total      = Game.difficulty,

			percentage = (elapsed / total) * 100,
			
			width      = Math.max(percentage, 0);

		$countdown.style.width = `${width}%`;

	},

	initialize () {

		let options = {

			countdown: true,

			callback: Game.tick,
			complete: Game.lose

		};

		Game.timer = new Tock(options);
	
	},

	resolve () {

		DOMNegotiator.reset();
		
		Game.score.reset();

		Game.status = "ongoing";

		Password.generate();

		DOMNegotiator.render();

		Game.timer.time.base
					? Game.timer.restart()
					: Game.timer.start(Game.difficulty);

	},

	lose () {

		Game.status = "lost";

		$main.classList.add("failed");

	},

	succeed () {

		Game.score.add(100);

		Game.resolve();

	},
	
	save () {}

};

let KeyHandler = function (event) {

	let key = event.key.toUpperCase();

	if (Game.status == "initial") {

		if (key != " ") return;

		Game.resolve();

		$menu.start.remove();

	};

	if (Game.status == "lost") {

		if (key != " ") return;

		Game.resolve();

	};

	let cell = Password.current.find(cell => cell.key == key);

	if (!cell && key.belongsTo(Password.alphabet)) {
		
		Game.timer.reduce(500);
		
		return;
		
	}
	
	if (cell.solved) return;
	
	cell.solved = true;

	DOMNegotiator.negotiate(cell);

	if (Password.solved()) Game.succeed();

};

let DOMNegotiator = {

	render () {
		
		for (cell of Password.current) cell.element.textContent = cell.key;

	},

	reset () {

		for (cell of Password.current) cell.element.classList.remove("solved");

		$main.classList.remove("failed");
			
	},

	negotiate (cell) {

		cell.element.classList.add("solved");

	}

};

let events = [

	{ type: "keypress", 		handler: KeyHandler 	 },
	{ type: "DOMContentLoaded", handler: Game.initialize },
	{ type: "beforeunload", 	handler: Game.save 		 }

];

for ({type, handler} of events) document.addEventListener(type, handler);

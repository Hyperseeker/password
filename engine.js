let $countdown = document.querySelector(".countdown"),
	$main      = document.querySelector("main"),
	$score     = document.querySelector(".score .value");

let Password = {

	current: [],

	length: 8,

	alphabet: [
		"0", "1", "2", "3", "4", "5", "6", "7",
		"8", "9", "A", "B", "C", "D", "E", "F",
		"G", "H", "J", "K", "M", "N", "P", "Q",
		"R", "S", "T", "V", "W", "X", "Y", "Z"
	],

	solved () { return Password.current.every(key => key.solved) },

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

	status: null,

	timer: null,

	difficulty: 5000,

	score: 0,

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
	
		Game.resolve();

	},

	resolve () {

		DOMNegotiator.reset();

		Game.status = "ongoing";

		Password.generate();

		DOMNegotiator.render();

		Game.timer.time.base ? Game.timer.restart() : Game.timer.start(Game.difficulty);

	},

	lose () {

		Game.status = "lost";

		Game.score = 0;

		$main.classList.add("failed");

	},

	succeed () {

		Game.score += 100;

		Game.resolve();

	},
	
	save () {}

};

let KeyHandler = function (event) {

	let key = event.key.toUpperCase();

	if (Game.status == "lost") {

		if (key != " ") return;

		Game.resolve();

	};

	let cell = Password.current.find(cell => cell.key == key);

	if (!cell) {
		
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

document.addEventListener("keypress", KeyHandler);

document.addEventListener("DOMContentLoaded", Game.initialize);

document.addEventListener("beforeunload", Game.save);

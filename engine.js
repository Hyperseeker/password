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

		let left = Password.length,
			used = [],

			cells = [...document.querySelectorAll(".cell")],

			pick = function () {

				let key = Password.alphabet.pick();

				while (key.belongsTo(used)) key = Password.alphabet.pick();
	
				used.last = key;

				return key;

			};
		
		while (left) Password.current.last = {
			
			key:    pick(),
			cell:   cells[Password.length - left--],
			solved: false
		
		};

	},

	reset () {

		for (key of Password.current) key.cell.classList.remove("solved");

		$main.classList.remove("failed");

		Game.status = "ongoing";
		
		Password.current = [];
	
	},

	resolve () {

		Password.reset();

		Password.generate();

		Password.render();

		Game.timer.time.base ? Game.timer.restart() : Game.timer.start(Game.difficulty);

	},

	render () {
		
		for (key of Password.current) key.cell.dataset.key = key.key;

	},

	negotiate (target) {

		let cell = Password.current.find(key => key.key == target).cell;

		cell.classList.add("solved");

	}

};

let Game = {

	status: null,

	timer: null,

	difficulty: 5000,


	tick () {

		let elapsed    = Game.timer.left(),
			total      = Game.difficulty,

			percentage = (elapsed / total) * 100;

		let width = Math.max(percentage, 0);

		$countdown.setAttribute("style", `width: ${width}%;`);

	},

	initialize () {

		let options = {

			countdown: true,

			callback: Game.tick,
			complete: Game.lose

		};

		Game.timer = new Tock(options);
	
		Password.resolve();

	},

	lose () {

		Game.status = "lost";

		$main.classList.add("failed");

	}

};

let $countdown = document.querySelector(".countdown"),
	$main      = document.querySelector("main");

let KeyHandler = function (event) {

	let key = event.key.toUpperCase();

	if (Game.status == "lost") {

		if (key != " ") return;

		Password.resolve();

	};

	let cell = Password.current.filter(cell => cell.key == key).first;

	if (!cell || cell.solved) return;

	cell.solved = true;

	Password.negotiate(cell.key);

	if (Password.solved()) Password.resolve();

};

window.addEventListener("keypress", KeyHandler);

document.addEventListener("DOMContentLoaded", Game.initialize);

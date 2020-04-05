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

	tuple: [],

	generate () {

		let left = Password.length,
			used = [],

			pick = function () {

				let key = Password.alphabet.pick();

				while (key.belongsTo(used)) key = Password.alphabet.pick();
	
				used.push(key);

				return key;

			};
		
		while (left--) Password.current.last = { key: pick(), solved: false };

		Password.tuple = Array.zip([...document.querySelectorAll(".cell")], Password.current);

	},

	reset () {

		for ([element, cell] of Password.tuple) element.classList.remove("solved");

		Game.$main.classList.remove("failed");

		Game.status = "ongoing";
		
		Password.current = [];
	
	},

	resolve () {

		Password.reset();

		Password.generate();

		Password.render();

		Game.timer.stop();
		Game.timer.start(Game.difficulty);

	},

	render () {
		
		for ([element, cell] of Password.tuple) element.dataset.key = cell.key;

	},

	negotiate (key) {

		let [element, cell] = Password.tuple.find(pair => pair.last.key == key);

		element.classList.add("solved");

	}

};

let Game = {

	status: null,

	timer: null,

	$countdown: document.querySelector(".countdown"),
	$main:      document.querySelector("main"),

	difficulty: 5000,

	adjustCountdown () {

		let elapsed    = Game.timer.lap(),
			total      = Game.difficulty,

			percentage = (elapsed / total) * 100;

		let width = Math.max(percentage, 0);

		Game.$countdown.setAttribute("style", `width: ${width}%;`);
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

		Game.$main.classList.add("failed");

	}

};

let listener = function (event) {

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

window.addEventListener("keypress", listener);

document.addEventListener("DOMContentLoaded", Game.initialize);

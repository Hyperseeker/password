let $playfield = document.querySelector(".playfield"),
	$score     = document.querySelector(".score"),
	$countdown = document.querySelector(".countdown"),

	$screen    = {

		menu: document.querySelector(".menu")

	};
	
let mobile = isMobile().any;

let Password = {

	current: [],
	
	elements: [...document.querySelectorAll("main kbd")],

	type: mobile,

	alphabet: [

		"0", "1", "2", "3", "4", "5", "6", "7",
		"8", "9", "a", "b", "c", "d", "e", "f",
		"g", "h", "j", "k", "m", "n", "p", "q",
		"r", "s", "t", "v", "w", "x", "y", "z"

	],

	solved () { return Password.current.every(cell => cell.solved) },
	
	generate () {
		
		let keys = Password.type 
							? Array.through(Game.difficulty.length, 1).shuffle() 
							: Password.alphabet.shuffle().slice(0, Game.difficulty.length);
							
		Password.current = keys.map((key, index) => {
			
			return {

				key,
				element: Password.elements[index],
				solved:  false

			}
		
		});
		
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

			Game.score.highest = Math.max(Game.score.current, Game.score.highest);
			
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
		
		if (mobile) document.body.classList.add("mobile");

	},

	resolve    () {

		ActionHandler._pressed = [];

		Password.generate();

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

		let reward = Game.difficulty.length / Game.difficulty.time * 20;

		Game.score.add(reward);

		Game.resolve();

	},

	start      () {

		Game.score.reset();

		Game.resolve();

		$screen.menu && $screen.menu.classList.add("hidden");

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

		setTimeout(() => $playfield.classList.remove("foul"), 125);

	},

	settings   () {},

	load       () {},
	
	save       () {}

};

let ActionHandler = {

	_pressed:   [],

	contextual  () {

		let action = {

			"initial": Game.start,
			"lost":    Game.start,

			"ongoing": Game.pause,
			"paused":  Game.unpause

		};

		action[Game.status]();

	},

	swipeup     () {

		let action = {

			"initial": Game.start,
			"lost":    Game.start,

			"ongoing": function () {},
			"paused":  Game.unpause

		};
		
		action[Game.status]();

	},

	swipedown   () {

		if (Game.status == "ongoing") Game.pause();

	},

	keydown    (event) {
		

		let key     = event.key.toLowerCase(),
			hotkeys = handler.registry.keydown.map(response => response.condition && response.condition.key && response.condition.key),
			isHotkey = key.belongsTo(hotkeys) || InteractionHandler.getAliasForKey(key).belongsTo(hotkeys);
		
		if (isHotkey) return;

		let cell = Password.current.find(cell => cell.key == key);

		if (Game.status == "ongoing") {

			if (cell) {

				cell.solved = true;

				if (Password.solved()) {

					Game.succeed();

					return;

				};

				ActionHandler._pressed.last = key;

				DOMNegotiator.negotiate(cell);

			} else {

				Game.foul();

			};

		};

	},

	keyup       (event) {

		let key  = event.key,
			cell = Password.current.find(cell => cell.key == key);

		if (cell) {

			if (key.belongsTo(ActionHandler._pressed)) ActionHandler._pressed.remove(key);

			DOMNegotiator.negotiate(cell);
		
		};

	},
	
	pointerdown (event) {
		
		if (!Password.type) return;
		
		let target   = event.target,
			key      = target.textContent,
			
			cell     = Password.current.find(cell => cell.key == key),
			previous = Password.current.find(cell => cell.key == key.pipe(parseInt) - 1);
			
		if (previous.solved) {
			
			cell.solved = true;
			
			if (Password.solved()) Game.succeed();
			
		} else {
			
			Game.foul();
			
		};
		
		ActionHandler._pressed.last = key;

		DOMNegotiator.negotiate(cell);
		
	},
	
	pointerup  (event) {
		
		if (!Password.type) return;
		
		let target   = event.target,
			key      = target.textContent,
			
			cell     = Password.current.find(cell => cell.key == key);
			
		if (previous.solved) {
			
			cell.solved = true;
			
			if (Password.solved()) Game.succeed();
			
		} else {
			
			Game.foul();
			
		};
		
		ActionHandler._pressed.last = key;

		DOMNegotiator.negotiate(cell);
		
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
		
		let pressed = cell.key.belongsTo(ActionHandler._pressed);

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

let gesture = new TinyGesture();

let handler = new InteractionHandler();

handler.register("keydown", { key: "space" }, ActionHandler.contextual);
handler.register("keydown", { key: "mod"   }, Game.settings);

// * prevent fouls on modifier keys
handler.register("keydown", { key: "shift" }, function () { /* noop */ });
handler.register("keydown", { key: "alt"   }, function () { /* noop */ });

handler.register("keydown",          null,    ActionHandler.keydown);
handler.register("keyup",            null,    ActionHandler.keyup);

handler.register("DOMContentLoaded", null,    Game.initialize);
handler.register("beforeunload",     null,    Game.save);

handler.register("swipeup",          null,    ActionHandler.swipeup);
handler.register("swipedown",        null,    ActionHandler.swipedown);
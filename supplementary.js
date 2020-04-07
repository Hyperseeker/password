Array.prototype.pick = function () { return this[Math.floor(Math.random() * (this.length - 1))] };

Object.defineProperty(Array.prototype, 'first', {

	get () { return this[0] },

	set (value) { this.unshift(value) }

});

Object.defineProperty(Array.prototype, 'last', {

	get () { return this[this.length - 1] },

	set (value) { this[this.length] = value }

});

Array.prototype.remove = function (item) {

	if (!this.includes(item)) return;

	this.splice(this.indexOf(item), 1);

	return this;

};

String.prototype.belongsTo = function (array) { return array.includes(this.valueOf()); }
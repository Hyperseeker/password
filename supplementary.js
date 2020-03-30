Array.prototype.pick = function () { return this[Math.floor(Math.random() * (this.length - 1))] };

Object.defineProperty(Array.prototype, 'first', {

	get () { return this[0] },

	set (value) { this.unshift(value) }

});

Object.defineProperty(Array.prototype, 'last', {

	get () { return this[this.length - 1] },

	set (value) { this[this.length] = value }

});

Array.zip = (...arrays) => arrays.first.map((_, index) => arrays.map(array => array[index]));

String.prototype.belongsTo = function (array) { return array.includes(this.valueOf()); }
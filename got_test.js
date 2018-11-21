const got = require('./source/index');

let datea1, datea2, datea3;
let dateb1, dateb2, dateb3;

dateb1 = Date.now();
got("https://www.google.com")
.then(response => {
	datea1 = Date.now();
	console.log('without cache: ' + (datea1 - dateb1));
	dateb2 = Date.now();
	got("https://www.google.com")
	.then(response => {
			datea2 = Date.now();
			console.log('with cache: ' + (datea2 - dateb2));
			dateb3 = Date.now();
			got("https://www.google.com")
			.then(response => {
					datea3 = Date.now();
					console.log('with cache: ' + (datea3 - dateb3));
				})
		})
});


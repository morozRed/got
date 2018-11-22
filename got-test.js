const got = require('./source/..');

let datea1, datea2;
let dateb1, dateb2;
let datec1, datec2;

datea1 = Date.now();
got('www.google.com').then((err, res) => {
    datea2 = Date.now()
    console.log('1 done in: ', Math.abs(datea1 - datea2));
    dateb1 = Date.now();
    got('www.google.com').then((err, res) => {
        dateb2 = Date.now()
        console.log('1 done in: ', Math.abs(dateb1 - dateb2));
        datec1 = Date.now();
        got('www.google.com').then((err, res) => {
            datec2 = Date.now()
            console.log('1 done in: ', Math.abs(datec1 - datec2));
        })
    })
})
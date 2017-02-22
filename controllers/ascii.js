var chalk = require('chalk');
var _ = require('lodash');

var letters = {
    S: [
        " _____ ", 
        "/  ___|", 
        "\\ `--. ", 
        " `--. \\", 
        "/\\__/ /", 
        "\\____/ "
    ],
    h: [
        " _     ", 
        "| |    ", 
        "| |__  ", 
        "| '_ \\ ", 
        "| | | |", 
        "|_| |_|"
    ],
    o: [
        "       ", 
        "       ", 
        "  ___  ", 
        " / _ \\ ", 
        "| (_) |", 
        " \\___/ "
    ],
    u: [
        "       ", 
        "       ", 
        " _   _ ", 
        "| | | |", 
        "| |_| |", 
        " \\__,_|"
    ],
    t: [
        " _   ", 
        "| |  ", 
        "| |_ ", 
        "| __|", 
        "| |_ ", 
        " \\__|"
    ],
    R: [
        "______ ", 
        "| ___ \\", 
        "| |_/ /", 
        "|    / ", 
        "| |\\ \\ ", 
        "|_| \\_|"
    ]
}

function renderLetter(textArray, letter, cb) {
    for (var i in letter) {
        textArray[i]+= cb(letter[i]);
    }

    return textArray;
}

function randomColor() {
    var color = _.sample(['red', 'blue', 'yellow', 'white', 'green']);
    
    return chalk[color];
}

var lines = ['','','','','',''];
var color1 = randomColor();
var color2 = randomColor();

color1 = chalk.green.bold;
color2 = chalk.white;

renderLetter(lines, letters.S, color1);
renderLetter(lines, letters.h, color2);
renderLetter(lines, letters.o, color2);
renderLetter(lines, letters.u, color2);
renderLetter(lines, letters.t, color2);
renderLetter(lines, letters.R, color1);

module.exports.renderCustom = function renderCustom(cb) {
    _.forEach(lines, function(n) {
        cb(n);
    });
}

module.exports.renderString = function renderString() {
    return lines.join('\n');
}

module.exports.render = function render() {
    _.forEach(lines, function(n) {
        console.log(n);
    });
}
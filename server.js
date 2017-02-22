var server, io;
var chalk = require('chalk');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var pkg = require('./package.json');

console.log(chalk.gray('booting ShoutR...'));

if (!argv.noart) {
    var appLogo = require('./controllers/ascii');
    appLogo.render();
    console.log(chalk.gray('               webserver               '));
    console.log(chalk.bold('----------------------------------------'));
    console.log();
}

var mongoose = require('mongoose');
var passport = require('passport');

var express = require('express');
var app = express();
var socketio = require('socket.io');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');

var notificationCtrl = require('./controllers/notification');

console.log('Running Shoutr on NodeJS', chalk.bold(process.version));
if (require('semver').lt(process.version, '6.0.0')) {
    console.log('Shoutr requires NodeJS 6 or higher');
    process.exit(1);
}

// Load environment variables from .env file
require('dotenv').load();

var gitData = require('child_process')
  .execSync('git show -s --format="%ci | %h | %ae | %ar | %s | %d"')
  .toString().trim().split(' | ');
gitData[5] = gitData[5].match(/HEAD -> ([\w-]+)/)[1]; 

console.log('Currently on branch', gitData[5], '(' + gitData[1] + ') -', gitData[4]);
console.log('Pushed', gitData[3], 'by', gitData[2]);
console.log('Push timestamp:', gitData[0]);
console.log();

// Passport OAuth strategies
require('./config/passport');
var config = require('./config/config.json');
var currentLanguage = config.defaults.language;

var templates = [];
var languages = {};

var items = fs.readdirSync('templates');
for (var i = 0; i < items.length; i++) {
    templates.push({ 
        'name': items[i].replace('.html',''), 
        'template': fs.readFileSync('templates/'  + items[i], 'utf8')
    });
}
console.log(chalk.green.bold('{green-fg}{bold}> Loaded Handlebar templates{/bold}{/green-fg}'));

var items = fs.readdirSync('languages');
for (var i = 0; i < items.length; i++) {
    languages[items[i].replace('.json','')] = JSON.parse(fs.readFileSync('languages/'  + items[i], 'utf8'));
}
console.log(chalk.green.bold('{green-fg}{bold}> Loaded language files{/bold}{/green-fg}'));


mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.error(chalk.bgRed.white.bold('{white-fg}{red-bg}{bold}ERROR - MongoDB Connection Error. Please make sure that MongoDB is running.{/bold}{/red-bg}{/white-fg}'));
    process.exit(1);
});
mongoose.connection.on('connected', function() {
    console.error(chalk.green.bold('{green-fg}{bold}> Connected to MongoDB{/bold}{/green-fg}'));
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', argv.port || 3000);
app.set('x-powered-by', false);

app.use(require('compression')());
app.use(require('morgan')('dev', {
    skip: function (req, res) { return res.statusCode < 400 && (req.url.indexOf('/js/') !== -1 || req.url.indexOf('/css/') !== -1 || req.url.indexOf('/fonts/') !== -1) }
}));
app.use(require('express-validator')());
app.use(require('method-override')('_method'));

app.use(require('express-flash')());

app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));

app.use(function(req, res, next) {
    if (res.locals.currentUser) {
        res.locals.currentUser.password = undefined;
        currentLanguage = res.locals.currentUser.language;
    }
    
    // console.log('cooookies', req.cookies);
    if (req.query.lang) {
        currentLanguage = req.query.lang;
        res.cookie('language', currentLanguage, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
    }

    res.locals.lang = languages[currentLanguage];
    res.locals.languages = config.languages;
    res.locals.currentLanguage = currentLanguage;
    
    _.forEach(templates, function(n) {
        n.template = n.template.replace(/#l{([\w\.]+)}/g, function(str, path) { return _.get(res.locals.lang, path); }); 
        return n;
    });
    
    res.locals.currentUser = req.user;
    res.locals.templates = templates;
    
    res.locals.version = pkg.version;

    next();
});

app.use(express.static(path.join(__dirname, 'assets')));
app.use('/libs', express.static(path.join(__dirname, 'bower_components')));

app.use('/api', require('./routes/api').routes);
app.use('', require('./routes/views').routes);

// Production error handler
if (app.get('env') === 'production') {
    app.use(function(err, req, res, next) {
        console.error(err.stack);
        res.sendStatus(err.status || 500);
    });
}

server = app.listen(app.get('port'), function() {
    console.log(chalk.green.bold('{green-fg}{bold}> Started webserver on port ' + app.get('port') + '{/bold}{/green-fg}'));
});

io = socketio.listen(server);

notificationCtrl.init(io);
console.log(chalk.green.bold('{green-fg}{bold}> Started notification service{/bold}{/green-fg}'));


module.exports = app;

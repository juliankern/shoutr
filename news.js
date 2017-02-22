var dotenv = require('dotenv');
var mongoose = require('mongoose');
var argv = require('minimist')(process.argv.slice(2));

var Notification = require('./models/notification');

// Load environment variables from .env file
dotenv.load();

mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
});

var news = new Notification({
    text: argv.text,
    headline: argv.headline,
    type: 'news'
});

news.save((err, saved) => {
    console.log('News saved', err, saved);
    process.exit(1);
})
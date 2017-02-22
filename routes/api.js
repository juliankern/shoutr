var express = require('express');
var apiCtrl = require('../controllers/api');
var userCtrl = require('../controllers/user');
var shoutCtrl = require('../controllers/shout');
var timelineCtrl = require('../controllers/timeline');
var notificationCtrl = require('../controllers/notification');

var apiRouter = express.Router();

apiRouter.route('/notification/read')
  .post(userCtrl.authenticated, notificationCtrl.read);

apiRouter.route('/language')
  .get(apiCtrl.language);

apiRouter.route('/timelines')
  .get(userCtrl.authenticated, timelineCtrl.get);
apiRouter.route('/timelines/new')
  .post(userCtrl.authenticated, timelineCtrl.new);
apiRouter.route('/timelines/add')
  .post(userCtrl.authenticated, timelineCtrl.add);
apiRouter.route('/timelines/remove')
  .post(userCtrl.authenticated, timelineCtrl.remove);

apiRouter.route('/timeline/:type')
  .get(timelineCtrl.shouts)

apiRouter.route('/shout')
  .post(userCtrl.authenticated, shoutCtrl.post);
apiRouter.route('/shout/:id')
  .get(shoutCtrl.get)
apiRouter.route('/shout/star')
  .post(userCtrl.authenticated, shoutCtrl.star);
apiRouter.route('/shout/delete')
  .post(userCtrl.authenticated, userCtrl.checkRight('canDeleteShouts'), shoutCtrl.delete);
  
apiRouter.route('/typeahead')
  .get(shoutCtrl.typeaheadData);
  
apiRouter.route('/login')
  .post(userCtrl.login);
  
exports.routes = apiRouter;


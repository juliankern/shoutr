var express = require('express');
var passport = require('passport');
var userCtrl = require('../controllers/user');

var contactCtrl = require('../controllers/contact');
var viewCtrl = require('../controllers/view');

var viewRouter = express.Router();

viewRouter.route('/')
  .get(viewCtrl.home);

viewRouter.route('/profile/:username')
  .get(viewCtrl.profile)
  .post(userCtrl.ensureAuthenticated, userCtrl.friendRequest);

viewRouter.route('/search/:query')
  .get(viewCtrl.search);
  
viewRouter.route('/contact')
  .get(viewCtrl.contact)
  .post(contactCtrl.contact);

viewRouter.route('/account')
  .get(userCtrl.ensureAuthenticated, viewCtrl.account)
  .put(userCtrl.ensureAuthenticated, userCtrl.accountPut)
  .delete(userCtrl.ensureAuthenticated, userCtrl.accountDelete);
viewRouter.route('/account/requests')
  .get(userCtrl.ensureAuthenticated, viewCtrl.requests)
  .post(userCtrl.ensureAuthenticated, userCtrl.changeRequest)
  
viewRouter.route('/friends')
  .get(userCtrl.ensureAuthenticated, viewCtrl.friends)
    
viewRouter.route('/signup')
  .get(viewCtrl.signup)
  .post(userCtrl.signup);
  
viewRouter.route('/login')
  .get(viewCtrl.login);

viewRouter.route('/forgot')
  .get(viewCtrl.forgot)
  .post(userCtrl.forgot);

viewRouter.route('/reset/:token')
  .get(viewCtrl.reset)
  .post(userCtrl.reset);
  
viewRouter.route('/logout')
  .get(userCtrl.logout);

viewRouter.route('/unlink/:provider')
  .get(userCtrl.ensureAuthenticated, userCtrl.unlink);

viewRouter.route('/auth/facebook')
  .get(passport.authenticate('facebook', { scope: ['email', 'user_location'] }))
viewRouter.route('/auth/facebook/callback')
  .get(passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }))
viewRouter.route('/auth/google')
  .get(passport.authenticate('google', { scope: 'profile email' }))
viewRouter.route('/auth/google/callback')
  .get(passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }))
viewRouter.route('/auth/twitter')
  .get(passport.authenticate('twitter'))
viewRouter.route('/auth/twitter/callback')
  .get(passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
  
exports.routes = viewRouter;
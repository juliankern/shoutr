var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');
var cookieCtrl = require('../controllers/cookieToken');

function resFake(data, cb) {
    return _.extend({
        json: function(d) {
            cb(JSON.stringify(d));
        }
    }, data);
}

describe.only('Basic tests: cookieToken', function() {
    it('Controller has functions', function() {
        cookieCtrl.should.have.property('consumeRememberMeToken');
        cookieCtrl.should.have.property('issueToken');
    });

    it('Function language is called', function() {
        var callback = sinon.spy();
        apiCtrl.language(null, resFake({ locals: { lang: 22 } }, callback));

        callback.called.should.be.ok();
    });
});

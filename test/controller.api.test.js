var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');
var apiCtrl = require('../controllers/api');

function resFake(data, cb) {
    return _.extend({
        json: function(d) {
            cb(JSON.stringify(d));
        }
    }, data);
}

describe('Basic tests: api', function() {
    it('Controller has functions', function() {
        apiCtrl.should.have.property('language');
    });

    it('Function language is called', function() {
        var callback = sinon.spy();
        apiCtrl.language(null, resFake({ locals: { lang: 22 } }, callback));

        callback.called.should.be.ok();
    });

    it('Function language is called correctly', function() {
        var callback = sinon.spy();
        apiCtrl.language(null, resFake({ locals: { lang: 22 } }, callback));

        callback.calledWith(JSON.stringify({ error: false, language: 22 })).should.be.ok();
    });
});

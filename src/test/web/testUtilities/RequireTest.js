define('RequireTest', ['chai', 'mocha', 'sinon', 'sinon-chai', 'chai-protobuf'], function (chai, mocha, sinon, SinonChai, ChaiProtobuf) {
    console.log('chai', chai);
    console.log('mocha', mocha);
    console.log('sinon', sinon);
    console.log('SinonChai', SinonChai);
    console.log('ChaiProtobuf', ChaiProtobuf);
    window.chai = chai;
    window.mocha = mocha;
    window.sinon = sinon;
    window.SinonChai = SinonChai;
    window.ChaiProtobuf = ChaiProtobuf;
    mocha.setup({
        ui: 'bdd',
        timeout: 5000
    });
    mocha.checkLeaks();
    chai.use(SinonChai);

    chai.use(function (_chai, _) {
        _chai.Assertion.addMethod('withMessage', function (msg) {
            _.flag(this, 'message', msg);
        });
    });

    return {
        createErrorCallback: function (expect, done) {
            return function (error) {
                console.log(error);
                expect(false).withMessage('' + error).to.be.true;
                if (typeof done !== 'undefined') {
                    done();
                }
            }
        }
    }
});

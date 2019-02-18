const authoriser = require('../../build/handler.js');
const expect = require('chai').expect;

describe('Lambda Authoriser', () => {
    describe('when authorisation header is not present', () => {
        const CONTEXT = {
            isFailed: false,
            failureReason: "",
            fail: function (failureString) {
                this.isFailed = true;
                this.failureReason = failureString;
            }
        };

        let event = {
            type: "TOKEN",
            authorizationToken: "",
            methodArn: "arn:aws:execute-api:eu-west-2:*:*/*/*/*"
        };

        it('should fail', () => {
            return authoriser.handler(event, CONTEXT)
                .then(() => {
                    expect(CONTEXT.isFailed).to.equal(true);
                });
        })
    });

    describe('when authorisation method is not BEARER', () => {
        const CONTEXT = {
            isFailed: false,
            failureReason: "",
            fail: function (failureString) {
                this.isFailed = true;
                this.failureReason = failureString;
            }
        };

        let event = {
            type: "TOKEN",
            authorizationToken: "BASIC",
            methodArn: "arn:aws:execute-api:eu-west-2:*:*/*/*/*"
        };

        it('should fail', () => {
            return authoriser.handler(event, CONTEXT)
                .then((response) => {
                    expect(CONTEXT.isFailed).to.equal(true);
                });
        })
    });
});

import { JWTService } from "../../src/services/JWTService";
import { expect } from "chai";
import { handler } from "../../src/handler";
 /// <reference path="./node_modules/typemoq/dist/typemoq.d.ts" />
import * as TypeMoq from "typemoq";

describe("Lambda Authoriser", () => {
    describe("when authorisation header is not present", () => {
        const CONTEXT = {
            isFailed: false,
            failureReason: "",
            fail(failureString: any) {
                this.isFailed = true;
                this.failureReason = failureString;
            }
        };

        const event = {
            type: "TOKEN",
            authorizationToken: "",
            methodArn: "arn:aws:execute-api:eu-west-2:*:*/*/*/*"
        };

        it("should fail", () => {
            return handler(event, CONTEXT)
                .then(() => {
                    expect(CONTEXT.isFailed).to.equal(true);
                });
        });
    });

    describe("when authorisation method is not BEARER", () => {
        const CONTEXT = {
            isFailed: false,
            failureReason: "",
            fail(failureString: any) {
                this.isFailed = true;
                this.failureReason = failureString;
            }
        };

        const event = {
            type: "TOKEN",
            authorizationToken: "BASIC",
            methodArn: "arn:aws:execute-api:eu-west-2:*:*/*/*/*"
        };

        it("should fail", () => {
            return handler(event, CONTEXT)
                .then(() => {
                    expect(CONTEXT.isFailed).to.equal(true);
                });
        });
    });

    describe("when authorisation method is not BEARE", () => {
        const CONTEXT = {
            isFailed: false,
            failureReason: "",
            fail(failureString: any) {
                this.isFailed = true;
                this.failureReason = failureString;
            }
        };

        const event = {
            type: "TOKEN",
            authorizationToken: "Bearer",
            methodArn: "arn:aws:execute-api:eu-west-2:*:*/*/*/*"
        };
        describe("and the token is not valid", () => {
            it("should fail", () => {
                const mock = TypeMoq.Mock.ofType(JWTService);
                mock.setup((m: any) => m.verify("this is an unouthorised token")).returns(() => Promise.resolve(1));
                return handler(event, CONTEXT)
                .then((data: any) => {
                    expect(data.principalId).to.equal("Unauthorised");
                });
            });
        });
    });
});

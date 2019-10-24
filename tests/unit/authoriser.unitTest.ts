import { JWTService } from "../../src/services/JWTService";
import { handler } from "../../src/handler";
import {StatusCodeError} from "request-promise/errors";
import AuthorizationError from "../../src/models/exceptions/AuthorizationError";

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
                    expect(CONTEXT.isFailed).toEqual(true);
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
                    expect(CONTEXT.isFailed).toEqual(true);
                });
        });
    });

    describe("when authorisation method is BEARER", () => {
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
        beforeEach(() => {
            jest.resetModules();
        });
        describe("and the token is not valid", () => {
            it("should fail, returning `Unauthorised`", () => {
                JWTService.prototype.verify  = jest.fn().mockRejectedValue("unauthorised");

                return handler(event, CONTEXT)
                    .then((data: any) => {
                        expect(data.principalId).toEqual("Unauthorised");
                    });
            });
        });

        describe("and the JWT service throws a StatusCodeError", () => {
            it("should fail, returning undefined", () => {
                // @ts-ignore
                const myError = new StatusCodeError(418, "Oh no! StatuscodeError!");
                JWTService.prototype.verify  = jest.fn().mockRejectedValue(myError);

                return handler(event, CONTEXT)
                  .then((data: any) => {
                      expect(data).toEqual(undefined);
                  });
            });
        });
        describe("and the JWT service throws an AuthorizationError", () => {
            it("should fail, returning undefined", () => {
                // @ts-ignore
                const myError = new AuthorizationError(418, "Oh no! AuthorizationError!");
                JWTService.prototype.verify  = jest.fn().mockRejectedValue(myError);

                return handler(event, CONTEXT)
                  .then((data: any) => {
                      expect(data).toEqual(undefined);
                  });
            });
        });
        describe("and the token is valid", () => {
            it("should return an authorised policy", () => {
                JWTService.prototype.verify  = jest.fn().mockResolvedValue({sub: "authorised"});

                return handler(event, CONTEXT)
                    .then((data: any) => {
                        expect(data.principalId).toEqual("authorised");
                        expect(data.policyDocument.Statement[0].Effect).toEqual("Allow");
                    });
            });
        });
    });
});

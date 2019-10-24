import {JWTService} from "../../src/services/JWTService";
import {Configuration} from "../../src/utils/Configuration";
jest.mock("../../src/utils/Configuration");
import * as JWT from "jsonwebtoken";
import AuthorizationError from "../../src/models/exceptions/AuthorizationError";
jest.mock("jsonwebtoken", () => {
  return {
    verify: () => true,
    decode: () => { return {
      header: {
        typ: "JWT",
        alg: "RS256",
        kid: "1LTMzakihiRla_8z2BEJVXeWMqo"
      },
      payload: {
        ver: "2.0",
        iss: "https://login.microsoftonline.com/9122040d-6c67-4c5b-b112-36a304b66dad/v2.0",
        sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
        aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
        exp: 1536361411,
        iat: 1536274711,
        nbf: 1536274711,
        name: "Abe Lincoln",
        preferred_username: "AbeLi@microsoft.com",
        oid: "00000000-0000-0000-66f3-3332eca7ea81",
        tid: "9122040d-6c67-4c5b-b112-36a304b66dad",
        nonce: "123523",
        aio: "Df2UVXL1ix!lMCWMSOJBcFatzcGfvFGhjKv8q5g0x732dR5MB5BisvGQO7YWByjd8iQDLq!eGbIDakyp5mnOrcdqHeYSnltepQmRp6AIZ8jY"
      },
      signature: "1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw"
    };
    }
  };
});
const jwtService = new JWTService();

describe("JWTService", () => {
  describe("validateRole()", () => {
    describe("when no roles returned", () => {
      it("should return false", () => {
        const decodedToken: any = {
          header: { alg: "HS256", typ: "JWT" },
          payload: { oid: "1234567890",
            name: "John Doe",
            upn: "test@email.com"
          },
          signature: "Jt0R3NSJHYCWj9zLkLfQo-ZYdPBYrT638_6Hjr0CAtk"
        };
        expect(jwtService.isAtLeastOneRoleValid(decodedToken)).toEqual(false);
      });
    });

    describe("when no role is one of the allowed ones", () => {
      it("should return false", () => {
        const decodedToken: any = {
          header: { alg: "HS256", typ: "JWT" },
          payload: { oid: "1234567890",
            name: "John Doe",
            upn: "test@email.com",
            roles: [ "invalidRole" ]
          },
          signature: "Jt0R3NSJHYCWj9zLkLfQo-ZYdPBYrT638_6Hjr0CAtk"
        };
        expect(jwtService.isAtLeastOneRoleValid(decodedToken)).toEqual(false);
      });
    });

    describe("when one role is one of the allowed ones", () => {
      it("should return true", () => {
        const decodedToken: any = {
          header: { alg: "HS256", typ: "JWT" },
          payload: { oid: "1234567890",
            name: "John Doe",
            upn: "test@email.com",
            roles: [ "CVSAdrTester" ]
          },
          signature: "Jt0R3NSJHYCWj9zLkLfQo-ZYdPBYrT638_6Hjr0CAtk"
        };
        expect(jwtService.isAtLeastOneRoleValid(decodedToken)).toEqual(true);
      });
    });

    describe("when two roles are ones of the allowed ones", () => {
      it("should return true", () => {
        const decodedToken: any = {
          header: { alg: "HS256", typ: "JWT" },
          payload: { oid: "1234567890",
            name: "John Doe",
            upn: "test@email.com",
            roles: [ "CVSPsvTester", "CVSTirTester" ]
          },
          signature: "Jt0R3NSJHYCWj9zLkLfQo-ZYdPBYrT638_6Hjr0CAtk"
        };
        expect(jwtService.isAtLeastOneRoleValid(decodedToken)).toEqual(true);
      });
    });

    describe("when one role is allowed and the another one is not", () => {
      it("should return true", () => {
        const decodedToken: any = {
          header: { alg: "HS256", typ: "JWT" },
          payload: { oid: "1234567890",
            name: "John Doe",
            upn: "test@email.com",
            roles: [ "CVSPsvTester", "invalidRole" ]
          },
          signature: "Jt0R3NSJHYCWj9zLkLfQo-ZYdPBYrT638_6Hjr0CAtk"
        };
        expect(jwtService.isAtLeastOneRoleValid(decodedToken)).toEqual(true);
      });
    });
  });

  describe("Verify function", () => {
    context("with missing config items", () => {
      context("missing all",  () => {
        it("it throws AuthorisationError", async () => {
          Configuration.getInstance = jest.fn().mockReturnValue({
            getConfig: () => { return; }
          });
          const srv = new JWTService();
          expect.assertions(2);
          try {
            await srv.verify("abc123");
          } catch (e) {
            expect(e).toBeInstanceOf(AuthorizationError);
            expect(e.message).toEqual("Azure configuration is not valid.");
          }
        });
      });
      context("missing Tenant details",  () => {
        it("it throws AuthorisationError", async () => {
          Configuration.getInstance = jest.fn().mockReturnValue({
            getConfig: () => {return {
              azure: {
                appId: "123abc",
                issuer: "https://sts.windows.net/:tennant/",
                jwk_endpoint: "https://login.microsoftonline.com/:tennant/discovery/keys"
              }
            };
            }
          });
          const srv = new JWTService();
          expect.assertions(2);
          try {
            await srv.verify("abc123");
          } catch (e) {
            expect(e).toBeInstanceOf(AuthorizationError);
            expect(e.message).toEqual("Azure configuration is not valid.");
          }
        });
      });
      context("missing jwk_endpoint details",  () => {
        it("it throws AuthorisationError", async () => {
          Configuration.getInstance = jest.fn().mockReturnValue({
            getConfig: () => {return {
              azure: {
                tennant: "abc123",
                appId: "123abc",
                issuer: "https://sts.windows.net/:tennant/",
              }
            };
            }
          });
          const srv = new JWTService();
          expect.assertions(2);
          try {
            await srv.verify("abc123");
          } catch (e) {
            expect(e).toBeInstanceOf(AuthorizationError);
            expect(e.message).toEqual("Azure configuration is not valid.");
          }
        });
      });
      context("missing issuer details",  () => {
        it("it throws AuthorisationError", async () => {
          Configuration.getInstance = jest.fn().mockReturnValue({
            getConfig: () => {return {
              azure: {
                tennant: "abc123",
                appId: "123abc",
                jwk_endpoint: "https://login.microsoftonline.com/:tennant/discovery/keys"
              }
            };
            }
          });
          const srv = new JWTService();
          expect.assertions(2);
          try {
            await srv.verify("abc123");
          } catch (e) {
            expect(e).toBeInstanceOf(AuthorizationError);
            expect(e.message).toEqual("Azure configuration is not valid.");
          }
        });
      });
      context("missing appID details",  () => {
        it("it throws AuthorisationError", async () => {
          Configuration.getInstance = jest.fn().mockReturnValue({
            getConfig: () => {return {
              azure: {
                tennant: "abc123",
                issuer: "https://sts.windows.net/:tennant/",
                jwk_endpoint: "https://login.microsoftonline.com/:tennant/discovery/keys"
              }
            };
            }
          });
          const srv = new JWTService();
          expect.assertions(2);
          try {
            await srv.verify("abc123");
          } catch (e) {
            expect(e).toBeInstanceOf(AuthorizationError);
            expect(e.message).toEqual("Azure configuration is not valid.");
          }
        });
      });
    });
    context("with AtLeastOneValidRole = true", () => {
      it("invokes fetchJWK", async () => {
        Configuration.getInstance = jest.fn().mockReturnValue({
          getConfig: () => {return {
            azure: {
              tennant: "abc123",
              appId: "123abc",
              issuer: "https://sts.windows.net/:tennant/",
              jwk_endpoint: "https://login.microsoftonline.com/:tennant/discovery/keys"
            }
          };
          }
        });
        const myMock = jest.fn().mockResolvedValue("A_CERTIFICATE");
        JWTService.prototype.fetchJWK = myMock;
        JWTService.prototype.isAtLeastOneRoleValid = jest.fn().mockReturnValue(true);
        const srv = new JWTService();
        const myToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTEyMjA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjkxMjIwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw";
        const output = await srv.verify(myToken);
        expect(myMock.mock.calls.length).toEqual(1);
        expect(output).toEqual(true);
      });
    });
    context("with AtLeastOneValidRole = false", () => {
      it("it throws AuthorisationError", async () => {
        Configuration.getInstance = jest.fn().mockReturnValue({
          getConfig: () => {return {
            azure: {
              tennant: "abc123",
              appId: "123abc",
              issuer: "https://sts.windows.net/:tennant/",
              jwk_endpoint: "https://login.microsoftonline.com/:tennant/discovery/keys"
            }
          };
          }
        });
        const myMock = jest.fn().mockResolvedValue("A_CERTIFICATE");
        JWTService.prototype.fetchJWK = myMock;
        JWTService.prototype.isAtLeastOneRoleValid = jest.fn().mockReturnValue(false);
        const srv = new JWTService();
        const myToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTEyMjA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjkxMjIwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw";
        try {
          await srv.verify(myToken);
        } catch (e) {
          expect(e).toBeInstanceOf(AuthorizationError);
          expect(e.message).toEqual("Invalid roles");
        }
      });
    });

  });
});

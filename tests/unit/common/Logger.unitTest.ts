import { ILogError } from "../../../src/models/ILogError";
import { ILogEvent } from "../../../src/models/ILogEvent";
import errorLogEvent from "../../resources/errorLogEvent.json";
import { writeLogMessage } from "../../../src/common/Logger";
import successLogEvent from "../../resources/successLogEvent.json";
import Role from "../../../src/services/roles";
import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

describe("test writeLogMessage method", () => {
  const logError: ILogError = {};
  const logErrorEvent: ILogEvent = errorLogEvent;
  const mockEvent = {} as APIGatewayTokenAuthorizerEvent;
  logErrorEvent.roles = [{ name: "test", access: "read" }] as Role[];

  beforeEach(() => {
    // reset the value of DEBUG_MODE for every test
    process.env.DEBUG_MODE = undefined;
  });

  context("when only the log event is passed in", () => {
    it("should return no errors", () => {
      const returnValue: ILogEvent = writeLogMessage(mockEvent, successLogEvent, null);

      expect(returnValue.statusCode).toBe(200);
    });
  });

  context("when log event and error are passed in", () => {
    it("should log TokenExpiredError", () => {
      const error: ILogError = { name: "TokenExpiredError", message: "Error" };
      console.log = jest.fn();

      logError.name = "TokenExpiredError";
      const returnValue: ILogEvent = writeLogMessage(mockEvent, logErrorEvent, error);

      expect(returnValue.error?.name).toBe("TokenExpiredError");
      expect(returnValue.error?.message).toBe("[JWT-ERROR-07] Error at undefined");
      expect(returnValue.email).toBe(logErrorEvent.email);
      expect(returnValue.roles).toBe(logErrorEvent.roles);
    });
  });

  it("should log NotBeforeError", () => {
    const error: ILogError = { name: "NotBeforeError" };
    console.log = jest.fn();

    logError.name = "NotBeforeError";
    const returnValue: ILogEvent = writeLogMessage(mockEvent, logErrorEvent, error);

    expect(returnValue.error?.name).toBe("NotBeforeError");
    expect(returnValue.error?.message).toBe("[JWT-ERROR-08] undefined until undefined");
    expect(returnValue.email).toBe(logErrorEvent.email);
    expect(returnValue.roles).toBe(logErrorEvent.roles);
  });

  it("should log JsonWebTokenError", () => {
    const error: ILogError = { name: "JsonWebTokenError", message: "test" };
    console.log = jest.fn();

    logError.name = "JsonWebTokenError";
    const returnValue: ILogEvent = writeLogMessage(mockEvent, logErrorEvent, error);

    expect(returnValue.error?.name).toBe("JsonWebTokenError");
    expect(returnValue.error?.message).toBe("[JWT-ERROR-09] test");
    expect(returnValue.email).toBe(logErrorEvent.email);
    expect(returnValue.roles).toBe(logErrorEvent.roles);
  });

  it("should log the default error", () => {
    const error: ILogError = { name: "Error", message: "Error" };
    console.log = jest.fn();

    const returnValue: ILogEvent = writeLogMessage(mockEvent, logErrorEvent, error);

    expect(returnValue.error?.name).toBe("Error");
    expect(returnValue.error?.message).toBe("Error");
    expect(returnValue.email).toBe(logErrorEvent.email);
    expect(returnValue.roles).toBe(logErrorEvent.roles);
  });

  it("should not log the authorizationToken when DEBUG_MODE is not set to true", () => {
    const error: ILogError = { name: "Error", message: "Error" };

    const returnValue: ILogEvent = writeLogMessage(
      {
        ...mockEvent,
        authorizationToken: errorLogEvent.token,
      },
      logErrorEvent,
      error
    );

    expect(returnValue.token).toBeUndefined();
  });

  it("should log the authorizationToken when DEBUG_MODE is set to true", () => {
    process.env.DEBUG_MODE = "true";

    const error: ILogError = { name: "Error", message: "Error" };

    const returnValue: ILogEvent = writeLogMessage(
      {
        ...mockEvent,
        authorizationToken: errorLogEvent.token,
      },
      logErrorEvent,
      error
    );

    expect(returnValue.token).toEqual(errorLogEvent.token);
  });
});

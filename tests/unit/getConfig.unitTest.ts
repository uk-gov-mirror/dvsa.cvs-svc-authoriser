import {safeDump} from "js-yaml";
import {getConfig} from "../../src/utils/getConfig";
import SecretsManager from "aws-sdk/clients/secretsmanager";

describe("getConfig", () => {
  const mockConf: IConfig = {
    azure: {
      tennant: "asdf",
      appId: "asdf",
      issuer: "asdf",
      jwk_endpoint: "asdf"
    }
  };
  const mockConfYaml = safeDump(mockConf);
  const mockFn = jest.fn();
  context("when SECRET_NAME env var set", () => {
    beforeAll(() => {
      process.env.SECRET_NAME = "fakeSecret";
      jest.mock("aws-sdk/clients/secretsmanager");
      mockFn.mockImplementation(() => ({promise: () => ({SecretString: mockConfYaml})}));
    });
    SecretsManager.prototype.getSecretValue = mockFn;
    it("should retrieve a configuration file from SecretsManager", async () => {
      const conf = await getConfig();
      expect.assertions(3);
      expect(conf).toStrictEqual(mockConf);
      expect(mockFn.mock.calls.length).toBe(1);
      expect(mockFn.mock.results[0].value.promise()).toStrictEqual({SecretString: mockConfYaml});
    });
    it("should throw an error if AWS SDK throws an error", async () => {
      const errMsg = "This is a fake error from AWS";
      mockFn.mockImplementationOnce(() => ({
        promise: () => {
          throw new Error(errMsg);
        }
      }));
      expect.assertions(1);
      await expect(getConfig()).rejects.toThrowError(errMsg);
    });
    afterAll(() => {
      jest.resetAllMocks();
      delete process.env.SECRET_NAME;
    });
  });
  context("when SECRET_NAME env var not set", () => {
    it("should throw an Error", async () => {
      await expect(getConfig()).rejects.toThrowError("SECRET_NAME environment variable not set!");
    });
  });
});

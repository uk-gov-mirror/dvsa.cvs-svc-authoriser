import {Configuration} from "../../src/utils/Configuration";

describe("Configuration util", () => {
  context("GetInstance", () => {
    it("populates the config from yml", () => {
      const config: any = Configuration.getInstance("../../tests/resources/fakeConfig.yml");
      expect(Object.keys(config.config)).toContain("azure");
      expect(config.config.azure.tennant).toEqual("abc123");
    });
    it("does not re-instantiate Config if already invoked once", () => {
      // second config file should make "tenant" equal "local", but won't if an instance is already there
      const config: any = Configuration.getInstance("../../tests/resources/fakeConfigWithEnvVariable.yml");
      expect(config.config.azure.tennant).toEqual("abc123");
    });
  });
  context("getconfig", () => {
    it("returns just the contents of the config object, rather than everything", () => {
      const config = Configuration.getInstance("../../tests/resources/fakeConfigWithEnvVariable.yml").getConfig();
      expect(Object.keys(config)).toContain("azure");
      expect(config.azure.tennant).toEqual("abc123");
    });
  });
  context("Constructor", () => {
    it("Overrides existing instance, populates the config and parses env variables", () => {
      // @ts-ignore
      const config: any = new Configuration("../../tests/resources/fakeConfigWithEnvVariable.yml");
      expect(Object.keys(config.config)).toContain("azure");
      expect(config.config.azure.tennant).toEqual("local");
    });
  });

});

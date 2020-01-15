export default interface IConfig {
  azure: {
    tennant: string
    appId: string
    issuer: string
    jwk_endpoint: string
  };
}

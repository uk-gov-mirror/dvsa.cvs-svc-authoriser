import { envLogger, LogLevel } from "../common/Logger";

export const isVersionEndpointRequest = (methodArn: string) => {
  // Extract path from methodArn
  const arnParts = methodArn.split(":");
  const resourceParts = arnParts[5].split("/");

  const httpMethod = resourceParts[2];
  const resourcePath = "/" + resourceParts.slice(3).join("/");

  envLogger(LogLevel.DEBUG, `isVersionEndpointRequest - RP: ${resourcePath}, HTTP: ${httpMethod}`);

  return httpMethod?.toUpperCase() === "GET" && resourcePath?.endsWith("/version");
};

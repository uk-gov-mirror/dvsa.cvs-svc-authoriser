export const isVersionEndpointRequest = (methodArn: string) => {
  // Extract path from methodArn
  const arnParts = methodArn.split(":");
  const resourceParts = arnParts[5].split("/");

  const stage = resourceParts[1];
  const httpMethod = resourceParts[2];
  const resourcePath = "/" + resourceParts.slice(3).join("/");

  console.log({
    stage, // e.g., 'prod'
    httpMethod, // e.g., 'GET'
    resourcePath, // e.g., '/users/123'
  });

  return httpMethod?.toUpperCase() === "GET" && resourcePath?.endsWith("/version");
};

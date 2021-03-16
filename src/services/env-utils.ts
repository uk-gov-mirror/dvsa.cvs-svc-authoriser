export const getEnvVar = (envVar: string, defaultValue: string) => {
  const value = process.env[envVar];

  if (!value || !value.trim()) {
    return defaultValue;
  }

  return value;
}

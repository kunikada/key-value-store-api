export async function validateApiKey(providedKey: string): Promise<boolean> {
  const secretKey = process.env.API_KEY;
  return providedKey === secretKey;
}

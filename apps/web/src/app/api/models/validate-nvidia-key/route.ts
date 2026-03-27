import { fail, ok, readJson } from "@/lib/server/route-utils";

type ValidateKeyBody = {
  apiKey?: string;
};

export async function POST(request: Request) {
  const body = await readJson<ValidateKeyBody>(request);
  const apiKey = body?.apiKey?.trim();

  if (!apiKey) {
    return fail("API key is required.");
  }

  const looksStructured = apiKey.length >= 24;

  return ok({
    valid: looksStructured,
    provider: "nvidia_free",
    message: looksStructured
      ? "Key format looks valid. Add a live provider ping once your NVIDIA integration details are finalized."
      : "Key format looks too short to be a valid NVIDIA API key.",
  });
}

import { ok, readJson } from "@/lib/server/route-utils";

type ArtifactUploadBody = {
  filename?: string;
};

export async function POST(request: Request) {
  const body = await readJson<ArtifactUploadBody>(request);
  const safeFilename = body?.filename?.replaceAll(/\s+/g, "-") || "artifact.bin";

  return ok({
    bucket: "forge-artifacts",
    path: `uploads/${Date.now()}-${safeFilename}`,
    signedUploadUrl: null,
    note: "Wire this to Supabase Storage signed upload URLs when your project keys are configured.",
  });
}

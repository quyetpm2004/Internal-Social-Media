import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/shared/lib/s3";

export async function getFileUrl(
  key: string,
  expiresInSeconds: number = 3600,
) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  });

  return url;
}

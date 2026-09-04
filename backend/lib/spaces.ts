import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const spaces = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export async function uploadToSpaces(file: Buffer, key: string, contentType: string) {
  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    })
  );
  return `${process.env.DO_SPACES_CDN}/${key}`;
}

export async function deleteFromSpaces(key: string) {
  await spaces.send(
    new DeleteObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
    })
  );
}

export function keyFromUrl(url: string) {
  const cdn = process.env.DO_SPACES_CDN!;
  return url.startsWith(cdn) ? url.slice(cdn.length).replace(/^\//, "") : null;
}
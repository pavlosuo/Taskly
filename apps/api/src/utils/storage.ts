import fs from "fs";
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} from "@/env";
import { ObjectId } from "mongodb";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export const mediaKey = (ownerId: ObjectId, filename: string) =>
  `${ownerId.toString()}/${filename}`;

export const storage = {
  async put(key: string, localPath: string, contentType: string) {
    await new Upload({
      client: s3,
      params: {
        Bucket: R2_BUCKET,
        Key: key,
        Body: fs.createReadStream(localPath),
        ContentType: contentType,
      },
    }).done();
  },
  async remove(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  },
  signedUrl(
    key: string,
    opts: { mimeType: string; disposition: string },
  ): Promise<string> {
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ResponseContentType: opts.mimeType,
        ResponseContentDisposition: opts.disposition,
      }),
      { expiresIn: 300 },
    );
  },
};

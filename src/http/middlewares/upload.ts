import { S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
import multerS3 from "multer-s3";
import CloudinaryStorage from "multer-storage-cloudinary";
import URL from "url";

dotenv.config();
const uri = URL.parse(process.env.CLOUDINARY_URL, true);

cloudinary.config({
  cloud_name: uri.host,
  api_key: uri.auth && uri.auth.split(":")[0],
  api_secret: uri.auth && uri.auth.split(":")[1],
  private_cdn: uri.pathname != null,
  secure_distribution: uri.pathname && uri.pathname.substring(1),
  secure: true,
});

const s3Config = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export const multerCloudinaryStorage = (dirname: string) => {
  return CloudinaryStorage({
    cloudinary,
    params: {
      folder: (req: Express.Request) => {
        let folder;
        if (req.session.folder) {
          folder = `${req.session?.id || "-"}/${req.session.folder}`;
          return folder;
        }
        folder = `${dirname}/${req.session?.id || "-"}/`;
        return folder;
      },
      format: async (_req: Express.Request, file: Express.Multer.File) => {
        return file.mimetype?.includes("image") ? "jpg" : "";
      },
      resource_type: async (
        _req: Express.Request,
        file: Express.Multer.File
      ) => {
        let resourceType = "raw";
        if (file.mimetype?.includes("image")) resourceType = "image";
        if (file.mimetype?.includes("video")) resourceType = "video";
        return resourceType;
      },
    } as any,
  });
};

export const multerAwsStorage = (dirname: string) => {
  return multerS3({
    s3: s3Config,
    bucket: process.env.BUCKET_NAME,
    key: function (req: Express.Request, file, cb) {
      let folder;
      if (req.session.folder) {
        folder = req.session.folder;
      } else {
        folder = req.session.id;
      }

      cb(null, folder);
    },
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
  });
};

export function multerCloudinaryUpload(dirname: string) {
  const x = multer({
    storage: multerAwsStorage(dirname),
    limits: { fileSize: 209715200 },
  });
  return x;
}

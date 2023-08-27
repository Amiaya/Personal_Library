import { Request, Response } from "express";
import APP_TYPES from "@app/config/types";
import { Controller, GenericMessage } from "@app/internal/http";
import { PaginatedResult } from "@app/internal/postgres";
import {
  DownloadLink,
  File,
  FileDTO,
  FileQuery,
  FileRepository,
  UnsafeFile,
} from "@app/files";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPatch,
  httpPost,
  queryParam,
  request,
  requestBody,
  requestParam,
  response,
} from "inversify-express-utils";
import { multerCloudinaryUpload } from "@app/http/middlewares/upload";
import { autoValidate, isEntityId } from "@app/internal/validator";
import { isFileQuery, isFileUpload, isUnsafe } from "./file.validator";
import { UserRepository } from "@app/users";
import { createFolder } from "@app/http/middlewares/create-folder";
import { ApplicationError } from "@app/internal/errors";
import { StatusCodes } from "http-status-codes";
import { HistoryRepository } from "@app/histories";
import INTERNAL_TYPES from "@app/internal/types";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EnvConfig } from "@app/internal/env";

type ControllerResponse =
  | Partial<File>
  | File[]
  | PaginatedResult<File>
  | GenericMessage
  | DownloadLink;

@controller("/files", APP_TYPES.AuthMiddleware)
export class FileController extends Controller<ControllerResponse> {
  @inject(APP_TYPES.UserRepository) private users: UserRepository;
  @inject(APP_TYPES.FileRepository) repo: FileRepository;
  @inject(APP_TYPES.HistoryRepository) history: HistoryRepository;
  @inject(INTERNAL_TYPES.S3Config) s3: S3Client;
  @inject(INTERNAL_TYPES.Env) env: EnvConfig;

  @httpPost(
    "/",
    createFolder,
    multerCloudinaryUpload("upload-files").single("file"),
    autoValidate(isFileUpload)
  )
  async uploadFile(
    @request() req: Request,
    @response() res: Response,
    @requestBody() dto: FileDTO
  ) {
    const user = await this.users.getById(req.session.id);
    const file = await this.repo.create({
      file: req.file?.location,
      size: req.file.size,
      file_name: dto.file_name,
      description: dto?.description,
      owner_id: user.id,
    });

    this.send(req, res, file);
    await this.history.record({
      file_id: file.id,
      file_status: "upload",
      user_id: user.id,
    });
  }

  @httpGet("/", autoValidate(isFileQuery, "query"))
  async list(
    @request() req: Request,
    @response() res: Response,
    @queryParam() query: FileQuery
  ) {
    const files = await this.repo.list(query);

    this.send(req, res, files);
  }

  @httpGet("/download/:id", autoValidate(isEntityId, "params"))
  async download(
    @request() req: Request,
    @response() res: Response,
    @requestParam("id") id: string
  ) {
    const file = await this.repo.getById(id);
    if (!file) {
      throw new ApplicationError(StatusCodes.NOT_FOUND, "File not found");
    }

    const imageName = file.file.split(".com/")[1];

    const downloadUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.env.bucket_name,
        Key: imageName,
      }),
      { expiresIn: 3600 }
    );

    this.send(req, res, { link: downloadUrl });
    await this.history.record({
      file_id: file.id,
      file_status: "download",
      user_id: req.session.id,
    });
  }

  @httpPatch(
    "/unsafe",
    autoValidate(isUnsafe, "body"),
    APP_TYPES.AccessMiddleware
  )
  async unsafe(
    @request() req: Request,
    @response() res: Response,
    @requestBody() dto: UnsafeFile
  ) {
    await Promise.all(
      dto.ids.map(async (id) => {
        const file = await this.repo.getById(id);
        const imageName = file.file.split(".com/")[1];
        this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.env.bucket_name,
            Key: imageName,
          })
        );
        await this.repo.deleteFile(id);
        return;
      })
    );

    this.send(req, res, { message: "Files have been successfully removed" });
  }
}

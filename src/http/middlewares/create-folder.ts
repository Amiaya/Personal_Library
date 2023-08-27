import { NextFunction, Request, Response } from "express";

export async function createFolder(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.query.folder) {
    req.session.folder = req.query.folder;
    req.body.folder = null;
  }
  next();
}

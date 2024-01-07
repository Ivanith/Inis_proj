import { validationResult } from "express-validator";
import { NextFunction, Response, Request } from "express";
export default (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }
  next();
};

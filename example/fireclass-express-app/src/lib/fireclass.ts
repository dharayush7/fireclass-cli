import "reflect-metadata";
import { createFireclass } from "@dharayush7/fireclass-js";
import { getDb } from "./firebase";

export const { BaseModel, adapter } = createFireclass(getDb());

export {
  Collection,
  Subcollection,
  fireclassErrorHandler,
} from "@dharayush7/fireclass-js";

import "reflect-metadata";
import { createFireclass } from "@dharayush7/fireclass-js";
import { getDb } from "./firebase.js";

export const { BaseModel, adapter } = createFireclass(getDb());

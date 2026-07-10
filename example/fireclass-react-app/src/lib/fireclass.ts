import "reflect-metadata";
import { createFireclass } from "@dharayush7/fireclass-react";
import { db } from "./firebase";

export const { BaseModel, useQuery, useDoc, adapter } = createFireclass(db);

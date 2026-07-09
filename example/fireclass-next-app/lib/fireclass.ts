import "server-only";
import "reflect-metadata";
import { getFireclass } from "@dharayush7/fireclass-ssr";

// Memoized firebase-admin singleton (credentials from env — see .env.local).
export const { BaseModel, adapter } = getFireclass();

export { Collection, Subcollection, serialize, serializeList, runAction } from "@dharayush7/fireclass-ssr";

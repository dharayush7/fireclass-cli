import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import "dotenv/config";

export function getDb(): Firestore {
  const clientEmail = process.env.CLIENT_EMAIL!;
  const privateKey = process.env.PRIVATE_KEY!;
  const projectId = process.env.PROJECT_ID!;

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        clientEmail,
        privateKey,
        projectId,
      }),
    });
  }
  return getFirestore();
}

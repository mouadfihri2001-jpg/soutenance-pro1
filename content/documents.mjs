import { readFileSync } from 'node:fs';
export const snapshot=JSON.parse(readFileSync(new URL('./documents.json',import.meta.url),'utf8'));
export const documents=snapshot.documents;

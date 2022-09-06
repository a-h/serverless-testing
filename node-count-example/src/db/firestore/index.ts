import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp()
const db = admin.firestore()

export interface Count {
	name: string
	count: number
}

export async function get(name: string): Promise<Count> {
	const record = await db.collection("count").doc(name).get()
	if (!record.exists) {
		return null
	}
	return record.data() as Count;
}

export async function put(name: string): Promise<Count> {
	await db.collection("count").doc(name).update({
		"count": FieldValue.increment(1),
	})
	return get(name);
}

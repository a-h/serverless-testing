import { HttpFunction } from '@google-cloud/functions-framework';
import express = require('express');
import * as countGet from "../get"
import * as countPost from "../post";
import * as db from "../../../db/firestore";

const app = express()
app.use(express.json())

app.get(countGet.route, countGet.create(db.get))
app.post(countPost.route, countPost.create(db.put))

export const fn: HttpFunction = app;

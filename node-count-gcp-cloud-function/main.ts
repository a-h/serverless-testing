import { Construct } from "constructs";
import { App, TerraformStack, RemoteBackend, TerraformAsset, AssetType, TerraformOutput } from "cdktf";
import {
    AppEngineApplication,
        CloudfunctionsFunction,
        CloudfunctionsFunctionIamBinding,
        GoogleProvider, StorageBucket, StorageBucketObject,
} from "@cdktf/provider-google";
import * as path from "path";
import * as fs from "fs";

class MyStack extends TerraformStack {
        constructor(scope: Construct, name: string) {
                super(scope, name);

                const credentialsPath = path.join(process.cwd(), "google.json");
                const credentials = fs.existsSync(credentialsPath)
                        ? fs.readFileSync(credentialsPath).toString()
                        : "{}";

                new GoogleProvider(this, "Google", {
                        region: "us-central1",
                        zone: "us-central1-c",
                        project: "quantum-plasma-316913",
                        credentials,
                });

                // Create a Cloud Firestore. This requires an AppEngine project.
                new AppEngineApplication(this, "app-engine-app", {
                        locationId: "europe-west",
                        databaseType: "CLOUD_FIRESTORE",
                })

                // Create a function.
                const codeBucket = new StorageBucket(this, "bucket", {
                        name: "a-h-node-count-storage-bucket",
                        location: "EU",
                });

                // This requires that the Cloud Function has already been built (i.e. esbuild has been run).
                // See the package.json file for node-count-example, for the build script (cloudfunction-build).
                const asset = new TerraformAsset(this, "cloud-function-asset", {
                        path: path.join(__dirname, "../node-count-example/src/http/count/cloudfunction/dist"),
                        type: AssetType.ARCHIVE,
                });

                const codeObject = new StorageBucketObject(this, "archive", {
                        name: asset.fileName,
                        bucket: codeBucket.name,
                        source: asset.path,
                });

                const cloudFunction = new CloudfunctionsFunction(this, "count", {
                        name: "fn",
                        runtime: "nodejs16",
                        availableMemoryMb: 256,
                        sourceArchiveBucket: codeBucket.name,
                        sourceArchiveObject: codeObject.name,
                        triggerHttp: true,
                })

                new CloudfunctionsFunctionIamBinding(this, "invoker", {
                        cloudFunction: cloudFunction.name,
                        members: ["allUsers"],
                        role: "roles/cloudfunctions.invoker",
                })

                new TerraformOutput(this, "cloudFunctionUrl", {
                        value: cloudFunction.httpsTriggerUrl,
                })
        }
}


const app = new App();
const stack = new MyStack(app, "node-count-gcp-cloud-function");
new RemoteBackend(stack, {
        hostname: "app.terraform.io",
        organization: "adrianhesketh",
        workspaces: {
                name: "node-count-gcp-cloud-function",
        },
});
app.synth();

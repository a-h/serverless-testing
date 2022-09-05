import { Construct } from "constructs";
import { App, TerraformStack, RemoteBackend } from "cdktf";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);
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

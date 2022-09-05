import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from "path"
import { FargateTaskDefinition, OperatingSystemFamily, CpuArchitecture, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { CfnOutput } from 'aws-cdk-lib';

export class NodeCountExampleAwsFargateStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const image = new DockerImageAsset(this, "DockerImage", {
			directory: path.join(__dirname, "../../node-count-example"),
			platform: Platform.LINUX_ARM64,
		})
		const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition", {
			runtimePlatform: {
				operatingSystemFamily: OperatingSystemFamily.LINUX,
				cpuArchitecture: CpuArchitecture.ARM64,
			},
			cpu: 1024,
			memoryLimitMiB: 2048,
		});
		taskDefinition.addContainer("Web", {
			portMappings: [{ containerPort: 3000 }],
			image: ContainerImage.fromDockerImageAsset(image),
		});
		const service = new ApplicationLoadBalancedFargateService(this, "LoadBalancedService", {
			assignPublicIp: true,
			taskDefinition,
		})
		new CfnOutput(this, "endpointURL", { value: service.loadBalancer.loadBalancerDnsName })
	}
}

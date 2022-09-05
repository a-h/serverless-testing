import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from "path"
import { FargateTaskDefinition, OperatingSystemFamily, CpuArchitecture, ContainerImage, AwsLogDriver } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { CfnOutput } from 'aws-cdk-lib';
import { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export class NodeCountExampleAwsFargateStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const table = new dynamodb.Table(this, "Table", {
			partitionKey: {
				name: "name",
				type: AttributeType.STRING,
			},
			billingMode: BillingMode.PAY_PER_REQUEST,
		});
		const region = cdk.Stack.of(this).region;

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
		table.grantReadWriteData(taskDefinition.taskRole)
		taskDefinition.addContainer("Web", {
			portMappings: [{ containerPort: 3000 }],
			image: ContainerImage.fromDockerImageAsset(image),
			environment: {
				TABLE_NAME: table.tableName,
				DYNAMODB_REGION: region,
			},
			logging: new AwsLogDriver({
				streamPrefix: "NodeCountExample",
			}),
		});
		const service = new ApplicationLoadBalancedFargateService(this, "LoadBalancedService", {
			assignPublicIp: true,
			taskDefinition,
		})
		service.targetGroup.configureHealthCheck({
			path: '/healthcheck',
			protocol: Protocol.HTTP,
			interval: cdk.Duration.seconds(5),
			timeout: cdk.Duration.seconds(3),
			healthyThresholdCount: 3,
		})
		new CfnOutput(this, "EndpointURL", { value: service.loadBalancer.loadBalancerDnsName })
	}
}

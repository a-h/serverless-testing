import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Duration, CfnOutput } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class NodeCountExampleAwsLambdaStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const table = new dynamodb.Table(this, "Table", {
			partitionKey: {
				name: "name",
				type: AttributeType.STRING,
			},
			billingMode: BillingMode.PAY_PER_REQUEST,
		});
		const region =  cdk.Stack.of(this).region;

		const api = new apigatewayv2.HttpApi(this, "Api")

		const countPostFunction = new NodejsFunction(this, "CountPostFunction", {
			environment: {
				TABLE_NAME: table.tableName,
				DYNAMODB_REGION: region,
			},
			entry: path.join(__dirname, "../../node-count-example/src/http/count/post/lambda/index.ts"),
			logRetention: logs.RetentionDays.ONE_MONTH,
			tracing: Tracing.ACTIVE,
			memorySize: 1024,
			timeout: Duration.seconds(10),
		});
		table.grantReadWriteData(countPostFunction);
		api.addRoutes({
			path: "/count/{proxy+}",
			methods: [apigatewayv2.HttpMethod.POST],
			integration: new HttpLambdaIntegration("CountPostIntegration", countPostFunction),
		});

		const countGetFunction = new NodejsFunction(this, "CountGetFunction", {
			environment: {
				TABLE_NAME: table.tableName,
				DYNAMODB_REGION: region,
			},
			entry: path.join(__dirname, "../../node-count-example/src/http/count/get/lambda/index.ts"),
			logRetention: logs.RetentionDays.ONE_MONTH,
			tracing: Tracing.ACTIVE,
			memorySize: 1024,
			timeout: Duration.seconds(10),
		});
		table.grantReadData(countGetFunction);
		api.addRoutes({
			path: "/count/{proxy+}",
			methods: [apigatewayv2.HttpMethod.GET],
			integration: new HttpLambdaIntegration("CountGetIntegration", countGetFunction),
		});

		new CfnOutput(this, "ApiEndpoint", {
			value: api.url as string,
		})
	}
}

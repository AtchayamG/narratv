import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import { createPipelineStateMachineDefinition } from '../step-functions/pipeline-state-machine';

export class NarraTvPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Storage Bucket for Titles, Audio Description Tracks, and Video Frames
    const mediaBucket = new s3.Bucket(this, 'NarraTvMediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // 2. CloudFront CDN Distribution
    const distribution = new cloudfront.Distribution(this, 'NarraTvDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(mediaBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      }
    });

    // Lambda execution role with Bedrock, Polly, and S3 permissions
    const lambdaRole = new iam.Role(this, 'NarraTvLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Grant Bedrock Model Access
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:Converse'],
        resources: ['*']
      })
    );

    // Grant Polly Access
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['polly:SynthesizeSpeech'],
        resources: ['*']
      })
    );

    // Grant S3 read/write access
    mediaBucket.grantReadWrite(lambdaRole);

    const commonEnv = {
      MEDIA_BUCKET_NAME: mediaBucket.bucketName,
      CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
      BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0',
      MAX_BEDROCK_CALLS: '120',
      APP_REVISION: '2026.09.02-production.v1'
    };

    // 3. Pipeline Lambdas
    const detectGapsLambda = new lambda.Function(this, 'DetectGapsFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/detect-gaps.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30)
    });

    const extractFramesLambda = new lambda.Function(this, 'ExtractFramesFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/extract-frames.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.minutes(3),
      memorySize: 1024
    });

    const describeLambda = new lambda.Function(this, 'DescribeFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/describe.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.minutes(1),
      memorySize: 512
    });

    const synthesizeLambda = new lambda.Function(this, 'SynthesizeFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/synthesize.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(45)
    });

    const publishLambda = new lambda.Function(this, 'PublishFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/publish.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30)
    });

    // 4. Step Functions State Machine
    const stateMachineDefinition = createPipelineStateMachineDefinition({
      detectGapsArn: detectGapsLambda.functionArn,
      extractFramesArn: extractFramesLambda.functionArn,
      describeArn: describeLambda.functionArn,
      synthesizeArn: synthesizeLambda.functionArn,
      publishArn: publishLambda.functionArn
    });

    const stateMachine = new sfn.StateMachine(this, 'NarraTvPipelineStateMachine', {
      definitionBody: sfn.DefinitionBody.fromString(JSON.stringify(stateMachineDefinition)),
      timeout: cdk.Duration.minutes(30)
    });

    // 5. API Gateway & Handler
    const apiLambda = new lambda.Function(this, 'NarraTvApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdas/api-handler.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      role: lambdaRole,
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30)
    });

    const httpApi = new apigateway.HttpApi(this, 'NarraTvHttpApi', {
      apiName: 'NarraTV API',
      description: 'Public API Gateway for NarraTV Fire TV application and Bedrock live describe endpoints',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowOrigins: ['*']
      }
    });

    const apiIntegration = new integrations.HttpLambdaIntegration('ApiIntegration', apiLambda);

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: apiIntegration
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway HTTP URL'
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront CDN URL'
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 Media Storage Bucket'
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions State Machine ARN'
    });
  }
}

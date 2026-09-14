import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
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
    //
    // These were `lambda.Code.fromInline('exports.handler = async () => {};')`
    // - six deployable functions containing a no-op, while the real handlers
    // sat in src/lambdas/*.ts and were never bundled. The stack synthesised,
    // the synth test passed on resource COUNTS, and deploying it would have
    // produced a live HTTPS endpoint that returned nothing. That is the worst
    // kind of green: a "live mode" URL a judge could open and get silence from.
    //
    // NodejsFunction bundles the actual TypeScript entry with esbuild, so what
    // deploys is the code the tests cover. A resource count is not a deployment.
    // Anchored on the PACKAGE root, then into src/ - never on __dirname alone.
    //
    // `path.join(__dirname, '..', 'lambdas')` looks right and works under
    // ts-jest, where __dirname is <pkg>/src/cdk. Compiled, __dirname is
    // <pkg>/dist/cdk, so it resolved to dist/lambdas and the deploy died with
    // "Cannot find entry file at ...\dist\lambdas\detect-gaps.ts" - esbuild
    // needs the TypeScript source, which only ever exists under src/.
    // Up two levels is <pkg> from either location.
    const lambdasDir = path.join(__dirname, '..', '..', 'src', 'lambdas');

    // The AWS SDK v3 clients are NOT in the Lambda Node 22 runtime by default,
    // so they must be bundled rather than marked external - a runtime
    // "Cannot find module '@aws-sdk/client-bedrock-runtime'" is exactly the
    // failure this whole change exists to prevent.
    const bundling = { minify: true, sourceMap: false, externalModules: [] as string[] };

    const fn = (id: string, entryFile: string, opts: Partial<cdk.aws_lambda.FunctionOptions> = {}) =>
      new NodejsFunction(this, id, {
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(lambdasDir, entryFile),
        handler: 'handler',
        role: lambdaRole,
        environment: commonEnv,
        bundling,
        ...opts
      });

    const detectGapsLambda = fn('DetectGapsFunction', 'detect-gaps.ts', {
      timeout: cdk.Duration.seconds(30)
    });

    const extractFramesLambda = fn('ExtractFramesFunction', 'extract-frames.ts', {
      timeout: cdk.Duration.minutes(3),
      memorySize: 1024
    });

    const describeLambda = fn('DescribeFunction', 'describe.ts', {
      timeout: cdk.Duration.minutes(1),
      memorySize: 512
    });

    const synthesizeLambda = fn('SynthesizeFunction', 'synthesize.ts', {
      timeout: cdk.Duration.seconds(45)
    });

    const publishLambda = fn('PublishFunction', 'publish.ts', {
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
    // The one the Fire TV app actually calls. BedrockDescribeClient does a
    // plain fetch() against this endpoint, which is why no AWS credentials ever
    // reach the television.
    const apiLambda = fn('NarraTvApiFunction', 'api-handler.ts', {
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // THROTTLED ON PURPOSE.
    //
    // /describe is unauthenticated - a Fire TV app cannot hold a secret, and
    // the whole point is that no AWS credential goes on the television. But an
    // open endpoint that invokes Bedrock Nova Pro on demand, published in a
    // public repository, is an invitation to spend somebody else's hackathon
    // credit. The credit is finite and expires with the hackathon.
    //
    // 5 requests/second with a burst of 10 is far more than the app needs (one
    // call per Describe press) and turns "run up the bill" into a slow grind
    // rather than a single afternoon. The $20 monthly budget alarm is the
    // backstop, not the defence.
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

    // The rate limit itself. See the note on the HttpApi above for why an
    // unauthenticated Bedrock-invoking endpoint gets one.
    const defaultStage = httpApi.defaultStage?.node.defaultChild as
      | apigateway.CfnStage
      | undefined;
    if (defaultStage) {
      defaultStage.defaultRouteSettings = {
        throttlingRateLimit: 5,
        throttlingBurstLimit: 10
      };
    }

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

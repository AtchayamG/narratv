import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NarraTvPipelineStack } from '../src/cdk/narratv-stack';

describe('AWS CDK Pipeline Stack Synthesis', () => {
  test('synthesizes S3 Bucket, CloudFront Distribution, Lambdas, and State Machine', () => {
    const app = new cdk.App();
    const stack = new NarraTvPipelineStack(app, 'TestNarraTvStack');
    const template = Template.fromStack(stack);

    // Verify S3 Bucket
    template.resourceCountIs('AWS::S3::Bucket', 1);

    // Verify CloudFront Distribution
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);

    // Verify Lambda Functions (5 pipeline + 1 API)
    template.resourceCountIs('AWS::Lambda::Function', 6);

    // Verify Step Functions State Machine
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

    // Verify HTTP API Gateway
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });
});

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NarraTvPipelineStack } from '../src/cdk/narratv-stack';

describe('AWS CDK Pipeline Stack Synthesis', () => {
  const synth = () => {
    const app = new cdk.App();
    const stack = new NarraTvPipelineStack(app, 'TestNarraTvStack');
    return Template.fromStack(stack);
  };

  test('synthesizes S3 Bucket, CloudFront Distribution, Lambdas, and State Machine', () => {
    const template = synth();

    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    // 5 pipeline + 1 API
    template.resourceCountIs('AWS::Lambda::Function', 6);
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  // This suite used to assert resource COUNTS and nothing else, and it passed
  // for weeks while all six functions were
  // `Code.fromInline('exports.handler = async () => {};')`. Six no-ops is six
  // Lambda resources. Counting proves the shape of a stack, never that it does
  // anything, and "deploys cleanly" would have meant "returns silence".
  describe('no function ships as a stub', () => {
    test('every Lambda has real bundled code, not inline source', () => {
      const template = synth();
      const functions = template.findResources('AWS::Lambda::Function');
      const ids = Object.keys(functions);

      expect(ids).toHaveLength(6);

      for (const id of ids) {
        const code = functions[id].Properties.Code;

        // An inline no-op would appear here as ZipFile. Real bundled output is
        // uploaded as an asset and referenced by S3Bucket/S3Key.
        expect(code.ZipFile).toBeUndefined();
        expect(code.S3Bucket).toBeDefined();
        expect(code.S3Key).toBeDefined();
      }
    });

    test('the handler the Fire TV app calls can reach Bedrock and Polly', () => {
      const template = synth();

      // The app's describe button is worthless if the execution role cannot
      // invoke the model, and that is a silent 403 at runtime rather than a
      // synth failure - so it is asserted here.
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['bedrock:InvokeModel']),
              Effect: 'Allow'
            }),
            Match.objectLike({
              Action: 'polly:SynthesizeSpeech',
              Effect: 'Allow'
            })
          ])
        })
      });
    });

    test('pins the Bedrock model the rest of the project claims to use', () => {
      const template = synth();
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({ BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0' })
        })
      });
    });
  });
});

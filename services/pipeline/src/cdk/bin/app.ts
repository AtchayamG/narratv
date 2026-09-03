import * as cdk from 'aws-cdk-lib';
import { NarraTvPipelineStack } from '../narratv-stack';

const app = new cdk.App();

new NarraTvPipelineStack(app, 'NarraTvPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1'
  },
  description: 'NarraTV: AI-Driven Scene Audio Description Pipeline for Amazon Fire TV (Build, Ship, Shape Hackathon 2026)'
});

app.synth();

import { createPipelineStateMachineDefinition } from '../src/step-functions/pipeline-state-machine';

describe('Step Functions State Machine Definition', () => {
  test('generates valid state machine structure with Map concurrency and ceiling check', () => {
    const def = createPipelineStateMachineDefinition({
      detectGapsArn: 'arn:aws:lambda:us-east-1:123456789012:function:detect-gaps',
      extractFramesArn: 'arn:aws:lambda:us-east-1:123456789012:function:extract-frames',
      describeArn: 'arn:aws:lambda:us-east-1:123456789012:function:describe',
      synthesizeArn: 'arn:aws:lambda:us-east-1:123456789012:function:synthesize',
      publishArn: 'arn:aws:lambda:us-east-1:123456789012:function:publish'
    });

    expect(def.StartAt).toBe('DetectGaps');
    expect(def.States['DetectGaps']).toBeDefined();
    expect(def.States['CheckGapsFound']).toBeDefined();
    expect(def.States['ProcessGapsMap']).toBeDefined();
    expect(def.States['FailMaxBedrockCallsExceeded']).toBeDefined();
    expect(def.States['PublishTrack']).toBeDefined();

    // Verify Map state iterator contains DescribeScene and SynthesizeAudio with retries
    const mapState = def.States['ProcessGapsMap'];
    expect(mapState.Type).toBe('Map');
    expect(mapState.MaxConcurrency).toBe(4);
    expect(mapState.Iterator.States['DescribeScene']).toBeDefined();
    expect(mapState.Iterator.States['SynthesizeAudio']).toBeDefined();
  });
});

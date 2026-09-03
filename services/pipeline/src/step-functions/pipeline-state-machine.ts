export interface StateMachineDefinition {
  Comment: string;
  StartAt: string;
  States: Record<string, any>;
}

export function createPipelineStateMachineDefinition(lambdaArns: {
  detectGapsArn: string;
  extractFramesArn: string;
  describeArn: string;
  synthesizeArn: string;
  publishArn: string;
}): StateMachineDefinition {
  return {
    Comment: 'NarraTV Audio Description Automated Ingestion & Processing Pipeline',
    StartAt: 'DetectGaps',
    States: {
      DetectGaps: {
        Type: 'Task',
        Resource: lambdaArns.detectGapsArn,
        ResultPath: '$.gapDetection',
        Next: 'CheckGapsFound',
        Retry: [
          {
            ErrorEquals: ['Lambda.ServiceException', 'Lambda.AWSLambdaException', 'Lambda.SdkClientException'],
            IntervalSeconds: 2,
            MaxAttempts: 3,
            BackoffRate: 2
          }
        ]
      },
      CheckGapsFound: {
        Type: 'Choice',
        Choices: [
          {
            Variable: '$.gapDetection.totalGaps',
            NumericGreaterThan: 120,
            Next: 'FailMaxBedrockCallsExceeded'
          },
          {
            Variable: '$.gapDetection.totalGaps',
            NumericEquals: 0,
            Next: 'PublishEmptyTrack'
          }
        ],
        Default: 'ExtractFrames'
      },
      FailMaxBedrockCallsExceeded: {
        Type: 'Fail',
        Error: 'MaxBedrockCallsExceeded',
        Cause: 'The film contains more dialogue-free gaps than the MAX_BEDROCK_CALLS ceiling (120).'
      },
      ExtractFrames: {
        Type: 'Task',
        Resource: lambdaArns.extractFramesArn,
        Parameters: {
          titleId: '$.titleId',
          videoS3Key: '$.videoS3Key',
          gaps: '$.gapDetection.gaps'
        },
        ResultPath: '$.extractedFrames',
        Next: 'ProcessGapsMap'
      },
      ProcessGapsMap: {
        Type: 'Map',
        ItemsPath: '$.gapDetection.gaps',
        MaxConcurrency: 4,
        ItemSelector: {
          'gap.$': '$$.Map.Item.Value',
          'titleId.$': '$.titleId'
        },
        ResultPath: '$.processedDescriptions',
        Iterator: {
          StartAt: 'DescribeScene',
          States: {
            DescribeScene: {
              Type: 'Task',
              Resource: lambdaArns.describeArn,
              Parameters: {
                titleId: '$.titleId',
                gapId: '$.gap.id',
                timestampSec: '$.gap.tStart',
                gapDurationSec: '$.gap.duration'
              },
              ResultPath: '$.description',
              Next: 'SynthesizeAudio',
              Retry: [
                {
                  ErrorEquals: ['ThrottlingException', 'ProvisionedThroughputExceededException', 'ServiceUnavailable'],
                  IntervalSeconds: 3,
                  MaxAttempts: 4,
                  BackoffRate: 2
                }
              ]
            },
            SynthesizeAudio: {
              Type: 'Task',
              Resource: lambdaArns.synthesizeArn,
              Parameters: {
                titleId: '$.titleId',
                description: '$.description'
              },
              End: true,
              Retry: [
                {
                  ErrorEquals: ['ThrottlingException', 'ServiceUnavailable'],
                  IntervalSeconds: 2,
                  MaxAttempts: 3,
                  BackoffRate: 2
                }
              ]
            }
          }
        },
        Next: 'PublishTrack'
      },
      PublishTrack: {
        Type: 'Task',
        Resource: lambdaArns.publishArn,
        Parameters: {
          titleId: '$.titleId',
          descriptions: '$.processedDescriptions',
          gaps: '$.gapDetection.gaps',
          cues: '$.gapDetection.cues'
        },
        End: true
      },
      PublishEmptyTrack: {
        Type: 'Task',
        Resource: lambdaArns.publishArn,
        Parameters: {
          titleId: '$.titleId',
          descriptions: [],
          gaps: [],
          cues: '$.gapDetection.cues'
        },
        End: true
      }
    }
  };
}

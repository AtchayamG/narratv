const fs = require('fs');
const path = require('path');
const { zodToJsonSchema } = require('zod-to-json-schema');
const {
  TitleSchema,
  SubtitleCueSchema,
  GapSchema,
  DescriptionSchema,
  LiveDescribeRequestSchema,
  DescriptionTrackSchema,
  HealthResponseSchema
} = require('../dist');

const outDir = path.resolve(__dirname, '../schema');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const schemas = {
  'title.schema.json': zodToJsonSchema(TitleSchema, 'Title'),
  'subtitle-cue.schema.json': zodToJsonSchema(SubtitleCueSchema, 'SubtitleCue'),
  'gap.schema.json': zodToJsonSchema(GapSchema, 'Gap'),
  'description.schema.json': zodToJsonSchema(DescriptionSchema, 'Description'),
  'live-describe-request.schema.json': zodToJsonSchema(LiveDescribeRequestSchema, 'LiveDescribeRequest'),
  'description-track.schema.json': zodToJsonSchema(DescriptionTrackSchema, 'DescriptionTrack'),
  'health-response.schema.json': zodToJsonSchema(HealthResponseSchema, 'HealthResponse')
};

for (const [filename, schema] of Object.entries(schemas)) {
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(schema, null, 2), 'utf-8');
  console.log(`Exported JSON schema: ${filename}`);
}

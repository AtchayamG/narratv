import fs from 'fs';
import path from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TitleSchema } from './title';
import { SubtitleCueSchema } from './subtitle';
import { GapSchema } from './gap';
import { DescriptionSchema, LiveDescribeRequestSchema } from './description';
import { DescriptionTrackSchema } from './track';
import { HealthResponseSchema } from './health';

const outDir = path.resolve(__dirname, '../schema');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const schemas: Record<string, any> = {
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

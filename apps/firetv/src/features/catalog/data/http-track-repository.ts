import { Title, DescriptionTrack, SubtitleCue, TitleSchema, DescriptionTrackSchema, SubtitleCueSchema } from '@narratv/contracts';
import { ITrackRepository } from '../domain/repository';
import { z } from 'zod';

export class HttpTrackRepository implements ITrackRepository {
  constructor(private readonly baseUrl: string) {
    if (!baseUrl) {
      // Intentionally unconfigured API check
    }
  }

  private async request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('LIVE unavailable: API_URL is not configured in environment.');
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (err: any) {
      throw new Error(`LIVE unavailable: Network connection failed to ${url} (${err?.message || 'Network error'})`);
    }

    if (!response.ok) {
      let errBody = '';
      try {
        errBody = await response.text();
      } catch {
        // ignore
      }
      throw new Error(`LIVE unavailable: HTTP ${response.status} ${response.statusText}${errBody ? ` - ${errBody}` : ''}`);
    }

    const json = await response.json();
    return schema.parse(json);
  }

  async getTitles(): Promise<Title[]> {
    return this.request('/titles', z.array(TitleSchema));
  }

  async getTitle(id: string): Promise<Title | null> {
    try {
      return await this.request(`/titles/${id}`, TitleSchema);
    } catch {
      return null;
    }
  }

  async getTrack(titleId: string): Promise<DescriptionTrack> {
    return this.request(`/titles/${titleId}/track`, DescriptionTrackSchema);
  }

  async getSubtitles(titleId: string): Promise<SubtitleCue[]> {
    return this.request(`/titles/${titleId}/subtitles`, z.array(SubtitleCueSchema));
  }
}

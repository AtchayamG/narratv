import { Title, DescriptionTrack, SubtitleCue } from '@narratv/contracts';

export interface ITrackRepository {
  getTitles(): Promise<Title[]>;
  getTitle(id: string): Promise<Title | null>;
  getTrack(titleId: string): Promise<DescriptionTrack>;
  getSubtitles(titleId: string): Promise<SubtitleCue[]>;
}

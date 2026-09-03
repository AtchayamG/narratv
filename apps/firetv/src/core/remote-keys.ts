export type RemoteKeyEventType =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'select'
  | 'playPause'
  | 'menu'
  | 'rewind'
  | 'fastForward'
  | 'back';

export interface RemoteKeyHandler {
  onSelect?: () => void;
  onLongSelect?: () => void;
  onPlayPause?: () => void;
  onLongPlayPause?: () => void;
  onMenu?: () => void;
  onBack?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

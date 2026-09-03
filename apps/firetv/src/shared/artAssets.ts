export const TITLE_ARTWORKS: Record<string, any> = {
  'sintel': require('../../assets/art/sintel.jpg'),
  'big-buck-bunny': require('../../assets/art/big_buck_bunny_poster.jpg'),
  'elephants-dream': require('../../assets/art/elephants_dream.jpg')
};

export function getTitleArtwork(titleId?: string, fallbackUri?: string): any {
  if (titleId && TITLE_ARTWORKS[titleId]) {
    return TITLE_ARTWORKS[titleId];
  }
  if (fallbackUri) {
    return { uri: fallbackUri };
  }
  return TITLE_ARTWORKS['sintel'];
}

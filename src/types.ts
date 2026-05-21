export type MockupType = 'none' | 'macos' | 'windows' | 'browser' | 'glass' | 'surface-pro' | 'surface-studio';
export type BackgroundType = 'transparent' | 'gradient-1' | 'gradient-2' | 'gradient-3' | 'solid-dark' | 'solid-light';

export interface EditorState {
  mockup: MockupType;
  background: BackgroundType;
  padding: number;
  shadow: boolean;
  tilt: boolean;
  lensBlur: boolean;
  autoZoom: boolean;
}

export type Scene = {
  id: string;
  type: 'recording';
  blobUrl?: string;
  duration?: number;
};

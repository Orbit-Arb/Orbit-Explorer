export type Page = 'explorer' | 'guide' | 'about';
export type Source =
  { kind: 'sample'; id: string } | { kind: 'import'; name: string };
export type ViewTab = 'diagram' | 'json';

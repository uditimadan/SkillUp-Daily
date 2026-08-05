export type Stage = 'starting' | 'practicing' | 'refining';

export type TodoItem = {
  id: string;
  text: string;
  stage: Stage;
  completed: boolean;
};

export const STAGE_ORDER: Stage[] = ['starting', 'practicing', 'refining'];

export const STAGE_META: Record<Stage, { label: string; color: string }> = {
  starting: { label: 'Starting', color: '#FFB84D' },
  practicing: { label: 'Practicing', color: '#5BC8F5' },
  refining: { label: 'Refining', color: '#7DE38C' },
};

export const nextStage = (stage: Stage): Stage => {
  const idx = STAGE_ORDER.indexOf(stage);
  return STAGE_ORDER[(idx + 1) % STAGE_ORDER.length];
};

export interface Clue {
  position: number;
  character: string;
  result: string;
}

// export interface ModelWord {
//   characters?: ModelCharacter[];
// }

export interface ModelCharacter {
  definitely?: string;
  maybe?: string[];
  not?: string[];
}

export interface Suggestion {
  word?: string;
  score?: number;
  disqualified: boolean;
}

export interface Limit {
  character: string;
  count: number;
}

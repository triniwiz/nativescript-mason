export interface Comment {
  id: number;
  by: string;
  agoHours: number;
  text: string;
  kids: Comment[];
}

export interface Story {
  id: number;
  title: string;
  url: string;
  domain: string;
  by: string;
  score: number;
  agoHours: number;
  descendants: number;
  tags: string[];
  comments: Comment[];
}

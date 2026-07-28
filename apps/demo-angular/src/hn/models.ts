export interface Comment {
  id: number;
  by: string;
  agoHours: number;
  text: string;
  /** Replies, nested arbitrarily deep — this is the point of the fixture. */
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

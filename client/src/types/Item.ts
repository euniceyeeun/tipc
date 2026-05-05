export type Point = {
  x: number;
  y: number;
};

export type Shape = {
  points: Point[];
  closed: boolean;
};

export type Item = {
  _id: string;
  title: string;
  author_first: string;
  author_last: string;
  note: string;
  owner: string;
  ownerUserId?: string;
  available: boolean;
  shape?: Shape;
};

export interface User {
  userID: string;
  name: string;
  password: string;
  imageURL?: string;
  created_at: string;
}

export interface Message {
  messageID: string;
  userID: string;
  message: string;
  toWhoID: string;
  created_at: string;
  users?: {
    name: string;
    imageURL: string;
  } | null;
}

export interface Post {
  postid: string;
  text: string;
  ownerid: string;
  created_at: string;
  users?: {
    name: string;
    imageurl?: string;
  };
  activities?: Array<{
    type: 'like' | 'comment';
    userid: string;
    message?: string;
    created_at: string;
    users?: {
      name: string;
      imageurl?: string;
    };
  }>;
}

export interface Activity {
  activityid: string;
  type: 'like' | 'comment';
  postid: string;
  userid: string;
  message?: string;
  created_at: string;
  users?: {
    name: string;
    imageurl?: string;
  };
}

export interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  image_url?: string;
  published_at: string;
} 
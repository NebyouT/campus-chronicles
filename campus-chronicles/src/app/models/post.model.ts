export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  userName: string;
  department: string;
  graduationYear: number;
  likes: number;
  likedBy?: string[];  // Array of user IDs who liked the post
  isLiked: boolean;
  createdAt: Date;
  testimonials?: Testimonial[];
}

export interface Testimonial {
  id?: string;
  message: string;
  userName: string;
  createdAt: Date;
  author?: {
    fullName: string;
    department: string;
    graduationYear: number;
  };
}

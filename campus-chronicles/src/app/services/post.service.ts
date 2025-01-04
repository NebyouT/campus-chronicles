import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Post, Testimonial } from '../models/post.model';
import { AuthService } from './auth.service';

interface PostsResponse {
  posts: Array<{
    id: string;
    _id: string;
    imageUrl: string;
    caption: string;
    author: {
      fullName: string;
      department: string;
      graduationYear: number;
    };
    likes: string[];
    likeCount: number;
    department: string;
    graduationYear: number;
    testimonials: Testimonial[];
    testimonialCount: number;
    createdAt: string;
  }>;
  totalPages: number;
  currentPage: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  getPosts(): Observable<Post[]> {
    console.log('Fetching posts...');
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user:', currentUser);
    
    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, this.getHeaders()).pipe(
      tap(response => console.log('Raw API response:', response)),
      map(response => response.posts.map(post => {
        const isLiked = Array.isArray(post.likes) && currentUser?.id 
          ? post.likes.includes(currentUser.id)
          : false;
        console.log(`Post ${post._id} liked status:`, isLiked);
        
        return {
          id: post.id || post._id,
          imageUrl: post.imageUrl,
          caption: post.caption,
          userName: post.author.fullName,
          department: post.department || post.author.department,
          graduationYear: post.graduationYear || post.author.graduationYear,
          likes: post.likeCount || (Array.isArray(post.likes) ? post.likes.length : 0),
          likedBy: Array.isArray(post.likes) ? post.likes : [],
          isLiked: isLiked,
          createdAt: new Date(post.createdAt),
          testimonials: post.testimonials || []
        };
      }))
    );
  }

  createPost(postData: FormData): Observable<Post> {
    console.log('Creating post...');
    return this.http.post<Post>(`${this.apiUrl}/posts`, postData, this.getHeaders()).pipe(
      tap({
        next: (response) => console.log('Post created:', response),
        error: (error) => console.error('Post creation error:', error)
      })
    );
  }

  getPost(id: string): Observable<Post> {
    console.log('Fetching post:', id);
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user:', currentUser);
    
    return this.http.get<any>(`${this.apiUrl}/posts/${id}`, this.getHeaders()).pipe(
      map(post => {
        console.log('Raw post data:', post);
        const isLiked = Array.isArray(post.likes) && currentUser?.id 
          ? post.likes.includes(currentUser.id)
          : false;
        console.log('Is post liked by current user:', isLiked);
        
        return {
          id: post.id || post._id,
          imageUrl: post.imageUrl,
          caption: post.caption,
          userName: post.author.fullName,
          department: post.department || post.author.department,
          graduationYear: post.graduationYear || post.author.graduationYear,
          likes: post.likeCount || (Array.isArray(post.likes) ? post.likes.length : 0),
          likedBy: Array.isArray(post.likes) ? post.likes : [],
          isLiked: isLiked,
          createdAt: new Date(post.createdAt),
          testimonials: post.testimonials || []
        };
      }),
      tap({
        next: (response) => console.log('Processed post data:', response),
        error: (error) => console.error('Post fetch error:', error)
      })
    );
  }

  likePost(postId: string): Observable<void> {
    console.log('Liking post:', postId);
    return this.http.post<void>(`${this.apiUrl}/posts/${postId}/like`, {}, this.getHeaders()).pipe(
      tap({
        next: () => console.log('Post liked:', postId),
        error: (error) => console.error('Post like error:', error)
      })
    );
  }

  unlikePost(postId: string): Observable<void> {
    console.log('Unliking post:', postId);
    return this.http.post<void>(`${this.apiUrl}/posts/${postId}/unlike`, {}, this.getHeaders()).pipe(
      tap({
        next: () => console.log('Post unliked:', postId),
        error: (error) => console.error('Post unlike error:', error)
      })
    );
  }

  addTestimonial(postId: string, content: string): Observable<Testimonial> {
    console.log('Adding testimonial:', { postId, content });
    return this.http.post<Testimonial>(
      `${this.apiUrl}/posts/${postId}/testimonial`,
      { message: content },
      this.getHeaders()
    ).pipe(
      tap({
        next: (response) => console.log('Testimonial response:', response),
        error: (error) => console.error('Testimonial error:', error)
      })
    );
  }

  deletePost(postId: string): Observable<void> {
    console.log('Deleting post:', postId);
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`, this.getHeaders()).pipe(
      tap({
        next: () => console.log('Post deleted:', postId),
        error: (error) => console.error('Post deletion error:', error)
      })
    );
  }
}

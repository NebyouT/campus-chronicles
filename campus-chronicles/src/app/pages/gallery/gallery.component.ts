import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post, Testimonial } from '../../models/post.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  loading = true;
  error: string | null = null;
  searchQuery = '';
  selectedPost: Post | null = null;
  newTestimonial = '';
  currentUser$: Observable<User | null>;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.loadPosts();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterPosts(query);
    });
  }

  loadPosts() {
    this.loading = true;
    this.error = null;
    this.posts = []; // Reset posts array
    this.filteredPosts = []; // Reset filtered posts

    this.postService.getPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Raw API response:', response);
          
          // Ensure response is an array
          if (Array.isArray(response)) {
            this.posts = response.map(post => ({
              id: post.id || '',
              imageUrl: post.imageUrl || '',
              caption: post.caption || '',
              userName: post.userName || '',
              department: post.department || '',
              graduationYear: post.graduationYear || 0,
              likes: post.likes || 0,
              isLiked: post.isLiked || false,
              createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
              testimonials: post.testimonials || []
            }));
          } else {
            console.error('API response is not an array:', response);
            this.error = 'Invalid data format received from server';
            this.posts = [];
          }
          
          this.filterPosts(this.searchQuery);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.error = err.message || 'Failed to load posts';
          this.loading = false;
          this.posts = [];
          this.filteredPosts = [];
        }
      });
  }

  private filterPosts(query: string) {
    if (!Array.isArray(this.posts)) {
      console.error('Posts is not an array:', this.posts);
      this.filteredPosts = [];
      return;
    }

    if (!query) {
      this.filteredPosts = [...this.posts];
      return;
    }

    const searchTerm = query.toLowerCase();
    this.filteredPosts = this.posts.filter(post =>
      (post.userName?.toLowerCase() || '').includes(searchTerm) ||
      (post.department?.toLowerCase() || '').includes(searchTerm) ||
      (post.graduationYear?.toString() || '').includes(searchTerm) ||
      (post.caption?.toLowerCase() || '').includes(searchTerm)
    );
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  toggleLike(post: Post, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User must be logged in to like posts');
      return;
    }

    const isCurrentlyLiked = post.isLiked;
    const currentLikes = post.likes;

    // Optimistically update UI
    post.isLiked = !isCurrentlyLiked;
    post.likes = isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1;

    const action = isCurrentlyLiked 
      ? this.postService.unlikePost(post.id)
      : this.postService.likePost(post.id);

    action.pipe(
      takeUntil(this.destroy$),
      // Refresh the post data after like/unlike
      switchMap(() => this.postService.getPost(post.id))
    ).subscribe({
      next: (updatedPost) => {
        // Update all properties of the post
        Object.assign(post, updatedPost);
      },
      error: (err) => {
        console.error('Failed to toggle like:', err);
        // Revert optimistic update on error
        post.isLiked = isCurrentlyLiked;
        post.likes = currentLikes;
      }
    });
  }

  openPostDetails(post: Post) {
    if (!post) return;
    this.selectedPost = { ...post }; // Create a copy to avoid direct mutations
    this.newTestimonial = '';
  }

  addTestimonial() {
    if (!this.selectedPost?.id || !this.newTestimonial?.trim()) {
      console.error('Invalid testimonial data:', { 
        postId: this.selectedPost?.id, 
        content: this.newTestimonial 
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User must be logged in to add testimonial');
      return;
    }

    console.log('Submitting testimonial:', {
      postId: this.selectedPost.id,
      content: this.newTestimonial,
      user: currentUser
    });

    this.postService.addTestimonial(
      this.selectedPost.id,
      this.newTestimonial.trim()
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (testimonial) => {
        console.log('Testimonial added successfully:', testimonial);
        if (this.selectedPost && testimonial) {
          if (!Array.isArray(this.selectedPost.testimonials)) {
            this.selectedPost.testimonials = [];
          }
          this.selectedPost.testimonials.unshift({
            ...testimonial,
            userName: currentUser.fullName,
            createdAt: new Date()
          });
          this.newTestimonial = '';
        }
      },
      error: (err) => {
        console.error('Failed to add testimonial:', err);
        // You might want to show an error message to the user here
        if (err.status === 404) {
          console.error('Endpoint not found. Please check the API endpoint configuration.');
        } else if (err.status === 401) {
          console.error('Unauthorized. Please check authentication.');
        }
      }
    });
  }
}

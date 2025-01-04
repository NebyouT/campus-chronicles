import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { Post } from '../../../models/post.model';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit, OnDestroy {
  post: Post | null = null;
  loading = true;
  error: string | null = null;
  newTestimonial = '';
  isLoggedIn = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService
  ) {
    this.isLoggedIn = !!this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['id']) {
        this.loadPost(params['id']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPost(id: string) {
    this.loading = true;
    this.error = null;

    this.postService.getPost(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.error = 'Failed to load post details';
        this.loading = false;
      }
    });
  }

  toggleLike() {
    if (!this.post) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User must be logged in to like posts');
      return;
    }

    const isCurrentlyLiked = this.post.isLiked;
    const currentLikes = this.post.likes;

    // Optimistically update UI
    this.post.isLiked = !isCurrentlyLiked;
    this.post.likes = isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1;

    const action = isCurrentlyLiked 
      ? this.postService.unlikePost(this.post.id)
      : this.postService.likePost(this.post.id);

    action.pipe(
      takeUntil(this.destroy$),
      // Refresh the post data after like/unlike
      switchMap(() => this.postService.getPost(this.post!.id))
    ).subscribe({
      next: (updatedPost) => {
        this.post = updatedPost;
      },
      error: (err) => {
        console.error('Failed to toggle like:', err);
        // Revert optimistic update on error
        this.post!.isLiked = isCurrentlyLiked;
        this.post!.likes = currentLikes;
      }
    });
  }

  addTestimonial() {
    if (!this.post?.id || !this.newTestimonial?.trim()) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User must be logged in to add testimonial');
      return;
    }

    this.postService.addTestimonial(
      this.post.id,
      this.newTestimonial.trim()
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (testimonial) => {
        if (this.post) {
          if (!Array.isArray(this.post.testimonials)) {
            this.post.testimonials = [];
          }
          this.post.testimonials.unshift({
            ...testimonial,
            userName: currentUser.fullName,
            author: {
              fullName: currentUser.fullName,
              department: currentUser.department || '',
              graduationYear: currentUser.graduationYear || 0
            },
            createdAt: new Date()
          });
          this.newTestimonial = '';
        }
      },
      error: (err) => console.error('Failed to add testimonial:', err)
    });
  }
}

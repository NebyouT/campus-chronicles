import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService, User } from '../../services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit, OnDestroy {
  postForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;
  error: string | null = null;
  showSuccess = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      caption: ['', [Validators.required, Validators.minLength(3)]],
      graduationYear: ['', [Validators.required]],
      department: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.postForm.patchValue({
            graduationYear: user.graduationYear,
            department: user.department
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select an image file';
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size should not exceed 5MB';
        return;
      }

      this.selectedFile = file;
      this.error = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.postForm.invalid || !this.selectedFile) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('caption', this.postForm.get('caption')?.value);
    formData.append('graduationYear', this.postForm.get('graduationYear')?.value);
    formData.append('department', this.postForm.get('department')?.value);

    try {
      await this.postService.createPost(formData).toPromise();
      this.showSuccess = true;
    } catch (err: any) {
      this.error = err.error?.message || 'Failed to create post';
    } finally {
      this.isSubmitting = false;
    }
  }

  resetForm() {
    this.showSuccess = false;
    this.postForm.reset({
      graduationYear: this.postForm.value.graduationYear,
      department: this.postForm.value.department
    });
    this.selectedFile = null;
    this.previewUrl = null;
    this.error = null;
  }
}

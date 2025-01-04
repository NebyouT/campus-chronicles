import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  loading: boolean = false;

  departments = [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Business Administration',
    'Other'
  ];

  graduationYears = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() + i).toString());

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      studentId: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9]+$')]],
      department: ['', Validators.required],
      graduationYear: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';

      const userData = {
        name: this.registerForm.value.name,
        studentId: this.registerForm.value.studentId,
        department: this.registerForm.value.department,
        graduationYear: this.registerForm.value.graduationYear,
        password: this.registerForm.value.password
      };

      this.authService.register(userData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/gallery']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'An error occurred during registration';
        }
      });
    }
  }
}

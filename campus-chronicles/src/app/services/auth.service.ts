import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  fullName: string;
  studentId: string;
  department: string;
  graduationYear: number;
  role: string;
}

interface BackendUser {
  _id: string;
  fullName: string;
  studentId: string;
  department: string;
  graduationYear: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: BackendUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      this.tokenSubject.next(storedToken);
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  private mapBackendUser(backendUser: BackendUser): User {
    return {
      id: backendUser._id,
      fullName: backendUser.fullName,
      studentId: backendUser.studentId,
      department: backendUser.department,
      graduationYear: parseInt(backendUser.graduationYear),
      role: backendUser.role
    };
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(userData: {
    name: string;
    studentId: string;
    department: string;
    graduationYear: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }

  private handleAuthentication(response: AuthResponse) {
    const mappedUser = this.mapBackendUser(response.user);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(mappedUser);
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { identifier, password })
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.tokenSubject.value;
  }

  getAuthorizationHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}

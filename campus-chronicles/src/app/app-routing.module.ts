import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { CreatePostComponent } from './pages/post/create-post.component';
import { PostDetailComponent } from './pages/post/post-detail/post-detail.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { LoginComponent } from './pages/auth/login/login.component';

const routes: Routes = [
  { path: '', component: GalleryComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'create-post', component: CreatePostComponent },
  { path: 'posts/:id', component: PostDetailComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

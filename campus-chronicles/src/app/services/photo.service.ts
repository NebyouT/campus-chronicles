import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthService, User } from './auth.service';
import { Observable, from, switchMap, map, of } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface Photo {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  userId: string;
  userName: string;
  createdAt: Date;
  likes: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photosCollection: AngularFirestoreCollection<Photo>;

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService
  ) {
    this.photosCollection = this.firestore.collection<Photo>('photos');
  }

  uploadPhoto(formData: FormData): Observable<Photo> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('User must be logged in to upload photos');
        }

        const file = formData.get('photo') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = JSON.parse(formData.get('tags') as string) as string[];

        // Create a unique file path
        const filePath = `photos/${user.studentId}/${new Date().getTime()}_${file.name}`;
        const fileRef = this.storage.ref(filePath);
        const task = this.storage.upload(filePath, file);

        // Upload the file then get the download URL
        return from(task).pipe(
          switchMap(() => fileRef.getDownloadURL()),
          switchMap(downloadUrl => {
            // Create the photo document
            const newPhoto: Omit<Photo, 'id'> = {
              title,
              description,
              imageUrl: downloadUrl,
              tags,
              userId: user.studentId,
              userName: user.fullName,
              createdAt: new Date(),
              likes: 0
            };

            // Add to Firestore
            return from(this.photosCollection.add(newPhoto)).pipe(
              map(docRef => ({ id: docRef.id, ...newPhoto } as Photo))
            );
          })
        );
      })
    );
  }

  getPhotos(): Observable<Photo[]> {
    return this.photosCollection.valueChanges({ idField: 'id' });
  }

  getUserPhotos(userId: string): Observable<Photo[]> {
    return this.firestore.collection<Photo>('photos', ref => 
      ref.where('userId', '==', userId).orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' });
  }

  getPhotoById(photoId: string): Observable<Photo | undefined> {
    return this.firestore.doc<Photo>(`photos/${photoId}`).valueChanges();
  }

  deletePhoto(photoId: string, imageUrl: string): Promise<void> {
    // Delete from Storage
    const storageRef = this.storage.refFromURL(imageUrl);
    return storageRef.delete().toPromise()
      .then(() => {
        // Delete from Firestore
        return this.firestore.doc(`photos/${photoId}`).delete();
      });
  }

  likePhoto(photoId: string): Promise<void> {
    return this.firestore.doc(`photos/${photoId}`).update({
      likes: firebase.firestore.FieldValue.increment(1)
    });
  }

  searchPhotos(query: string): Observable<Photo[]> {
    // Convert query to lowercase for case-insensitive search
    const searchTerm = query.toLowerCase();
    
    return this.photosCollection.valueChanges({ idField: 'id' }).pipe(
      map(photos => photos.filter(photo => {
        const titleMatch = photo.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = photo.description.toLowerCase().includes(searchTerm);
        const tagMatch = photo.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return titleMatch || descriptionMatch || tagMatch;
      }))
    );
  }
}

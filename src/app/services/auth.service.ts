import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private sessionTimeoutSubject = new BehaviorSubject<boolean>(false);
  public sessionTimeout$ = this.sessionTimeoutSubject.asObservable();

  private sessionTimeoutTimer: any;
  private warningTimeoutTimer: any;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (!environment.firebase.apiKey || environment.firebase.apiKey === 'YOUR_API_KEY') {
        console.warn('Firebase configuration not set. Please update src/environments/environment.ts with your Firebase credentials.');
        return;
      }

      const app = initializeApp(environment.firebase);
      const auth = getAuth(app);

      onAuthStateChanged(auth, (user) => {
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);

        if (user) {
          this.startSessionTimeout();
        } else {
          this.clearSessionTimeout();
        }
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      if (!environment.firebase.apiKey || environment.firebase.apiKey === 'YOUR_API_KEY') {
        throw new Error('Firebase is not configured. Please set up your Firebase credentials in src/environments/environment.ts');
      }

      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.clearSessionTimeout();
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private startSessionTimeout(): void {
    this.resetSessionTimeout();
  }

  resetSessionTimeout(): void {
    this.clearSessionTimeout();
    this.sessionTimeoutSubject.next(false);

    this.sessionTimeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, SESSION_TIMEOUT);
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }
    if (this.warningTimeoutTimer) {
      clearTimeout(this.warningTimeoutTimer);
    }
  }

  private handleSessionTimeout(): void {
    this.logout().catch(error => {
      console.error('Session timeout logout error:', error);
    });
  }
}

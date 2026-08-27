import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserSessionPersistence,
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

  private initializationCompleteSubject = new BehaviorSubject<boolean>(false);
  public initializationComplete$ = this.initializationCompleteSubject.asObservable();

  private sessionTimeoutTimer: any;
  private warningTimeoutTimer: any;
  private auth: any;

  constructor() {
    console.log('[AuthService] Constructor called');
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      console.log('[AuthService] initializeFirebase started');

      if (!environment.firebase.apiKey || environment.firebase.apiKey === 'YOUR_API_KEY') {
        console.warn('Firebase configuration not set. Please update src/environments/environment.ts with your Firebase credentials.');
        this.initializationCompleteSubject.next(true);
        return;
      }

      const app = initializeApp(environment.firebase);
      this.auth = getAuth(app);
      console.log('[AuthService] Firebase initialized');

      // セッションpersistenceを設定（ブラウザを閉じるとセッションが消える）
      setPersistence(this.auth, browserSessionPersistence);

      // 認証状態をリスニング
      onAuthStateChanged(this.auth, (user) => {
        console.log('[AuthService] onAuthStateChanged fired:', user?.email || 'No user');
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        this.initializationCompleteSubject.next(true);

        if (user) {
          this.startSessionTimeout();
        } else {
          this.clearSessionTimeout();
        }
      });
    } catch (error) {
      console.error('[AuthService] Firebase initialization error:', error);
      this.initializationCompleteSubject.next(true);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      console.log('[AuthService] loginWithGoogle called');

      if (!environment.firebase.apiKey || environment.firebase.apiKey === 'YOUR_API_KEY') {
        throw new Error('Firebase is not configured. Please set up your Firebase credentials in src/environments/environment.ts');
      }

      const auth = this.auth || getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      console.log('[AuthService] Opening Google login popup...');
      await signInWithPopup(auth, provider);
      console.log('[AuthService] Login successful');
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('[AuthService] logout called');
      this.clearSessionTimeout();
      const auth = this.auth || getAuth();
      await signOut(auth);
      console.log('[AuthService] Logout completed');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
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

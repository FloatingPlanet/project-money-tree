import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from 'angularfire2/firestore';
import {User} from '../../models/user';
import {AddressInfo} from '../../models/addressInfo';
import {Product} from '../../models/product';
import * as firebase from 'firebase';
import {User as FirebaseUser, UserCredential} from '@firebase/auth-types';
import {AngularFireAuth} from 'angularfire2/auth';
import {FlashMessageService} from '../flashMessage/flash-message.service';
import {Router} from '@angular/router';
import {from, merge} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public authMetaData: FirebaseUser = null;
  public Users: AngularFirestoreCollection<User>;
  public user: User;
  public isLogged: boolean;

  constructor(private afAuth: AngularFireAuth,
              private db: AngularFirestore,
              private fs: FlashMessageService,
              private router: Router) {
    this.Users = this.db.collection('Users');
    this.afAuth.authState.subscribe((auth) => {
      this.authMetaData = auth;
      this.isLogged = true;
    });
  }

  /*
  return login observable
   */
  get logInObservable(): any {
    return this.afAuth.authState;
  }

  /*
  return user info observable
   */
  get userObservable() {
    if (this.currentUserId) {
      return this.Users.doc(this.currentUserId).valueChanges();
    }
  }

  /*
  return user address observable
   */
  get userAddressObservable() {
    if (this.isLogged) {
      return this.Users.doc(this.authMetaData.uid).collection('addresses').valueChanges();
    }
  }


  // TODO merge two observable
  get userDataObservable() {
    return this.logInObservable.pipe(
      mergeMap(auth => this.userObservable.pipe(map(user => (user)))
      ));
  }

  /*
  add @product to user' cart collection
   */
  public addProductToCart(product: Product) {
    return new Promise((res, rej) => {
      this.logInObservable.subscribe((auth) => {
        if (auth) {
          this.Users.doc(auth.uid).update({
            cart: firebase.firestore.FieldValue.arrayUnion(product)
          }).catch(r => {
            console.error(r);
          });
        } else {
          rej('user is logged out');
        }
      });
    });
  }

  public deleteProduct(SKU: number) {

  }


  public addAddress(address: AddressInfo) {
    return new Promise((res, rej) => {
      this.logInObservable.subscribe((auth) => {
        if (auth) {
          const addresses = this.Users.doc(auth.uid).collection('addresses');
          addresses.doc(address.addressId).set(address).then(() => {
            console.log(`Added ${address.addressId} to addresses.`);
            res(address.addressId);
          }).catch(r => {
            console.error(r);
            rej(`cannot add address`);
          });
        } else {
          rej('user is logged out');
        }
      });
    });
  }

  public deleteAddress(id: string) {
    return new Promise((res, rej) => {
      this.logInObservable.subscribe((auth) => {
        if (auth) {
          const addresses = this.Users.doc(auth.uid).collection('addresses');
          addresses.doc(id).delete().then(() => {
            console.log(`${id} is deleted`);
            res(`${id} is deleted`);
          }).catch((error) => {
            console.error(error);
            rej(`failed to delete address ${id}`);
          });
        } else {
          rej(`user is logged out`);
        }
      });
    });
  }


  /* #########################################################################
  ############################################################################
       Following functions are the examples how to write spaghetti code.
       Do not delete them, 以儆效尤！
  ############################################################################
  ############################################################################
   */
  get currentUserName(): string {
    if (!this.authMetaData) {
      return 'Guest';
    } else if (this.currentUserAnonymous) {
      return 'Anonymous';
    } else {
      return this.authMetaData.displayName || 'User without a Name';
    }
  }

  get authenticated(): boolean {
    return this.authMetaData !== null;
  }

  // Returns current user data
  get currentUser(): any {
    return this.authenticated ? this.authMetaData : null;
  }


  // Returns current user UID
  get currentUserId(): string {
    return this.authenticated ? this.authMetaData.uid : '';
  }

  // Anonymous User
  get currentUserAnonymous(): boolean {
    return this.authenticated ? this.authMetaData.isAnonymous : false;
  }

  githubLogin() {
    const provider = new firebase.auth.GithubAuthProvider();
    return this.socialSignIn(provider);
  }

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.socialSignIn(provider);
  }

  facebookLogin() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.socialSignIn(provider);
  }

  twitterLogin() {
    const provider = new firebase.auth.TwitterAuthProvider();
    return this.socialSignIn(provider);
  }

  private socialSignIn(provider: firebase.auth.AuthProvider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        this.authMetaData = credential.user;
        this.updateUserData();
        this.fs.success('3rd party log in successful', 'You\'ve been logged in with ' + provider.providerId);
      })
      .catch(error => {
        this.fs.error('3rd party login failed', error.message);
        console.log(error);
      });
  }


  //// Anonymous Auth ////

  anonymousLogin() {
    return this.afAuth.auth.signInAnonymously()
      .then((res: UserCredential) => {
        this.authMetaData = res.user;
        this.updateUserData();
      })
      .catch(error => {
        console.log(error);
      });
  }

  //// Email/Password Auth ////

  emailSignUp(login) {
    return this.afAuth.auth.createUserWithEmailAndPassword(login.email, login.password)
      .then((credential: UserCredential) => {
        this.authMetaData = credential.user;
        this.updateUserData();
        this.afAuth.auth.currentUser.updateProfile({displayName: login.username});
        this.fs.success('Sign up success', 'You\'ve been logged in');
      })
      .catch(error => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/weak-password') {
          this.fs.error('Sign up error', 'The password is too weak.');
        } else {
          this.fs.error('Sign up error', errorMessage);
        }
        console.log(error);
      });
  }

  emailLogin(login) {
    return this.afAuth.auth.signInWithEmailAndPassword(login.email, login.password)
      .then((res: UserCredential) => {
        this.authMetaData = res.user;
        this.updateUserData();
        this.fs.success('Log in', 'You\'ve been logged in');
      })
      .catch(error => {
        console.log(error);
        this.fs.error('Log in failed', error.message);
      });
  }

  // Sends email allowing user to reset password
  resetPassword(email: string) {
    const auth = firebase.auth();

    return auth.sendPasswordResetEmail(email)
      .then(() => {
        console.log('email sent');
        this.fs.success('Password reset', 'An email with reset link has been sent to your email address. Please check your inbox');
      })
      .catch((error) => console.log(error));
  }


  //// Sign Out ////

  signOut(): void {
    this.afAuth.auth.signOut().then(() => {
      this.isLogged = false;
      this.fs.success('Log out', 'You\'ve been logged out');
    });

  }

  //// Helpers ////

  private updateUserData(): void {
    // Writes user name and email to realtime db
    // useful if your app displays information about users or for admin features
    this.Users.doc(this.currentUserId).set({
      email: this.currentUser.email,
      username: this.currentUser.displayName
    }, {merge: true});
  }
}


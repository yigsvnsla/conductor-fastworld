import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CookiesService } from '../services/cookies.service';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AutoLoginGuard implements CanActivate {

  constructor(
    private localStorageService:LocalStorageService,
    private router:Router,
    private cookieService:CookiesService
  ){

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return new Promise<boolean>( async (resolve, reject) => {

        const checkUser = (await this.localStorageService.check(environment['user_tag']))
        const checkCookie = this.cookieService.check(environment.cookie_tag)

        if ( checkUser && checkCookie) resolve(true);
        else  this.router.navigateByUrl('auth'); reject(false);
        
      })
  }
  
}

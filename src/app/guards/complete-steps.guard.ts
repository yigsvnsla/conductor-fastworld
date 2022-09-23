import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SlidesLoginStepsComponent } from '../pages/generic-components/slides-login-steps/slides-login-steps.component';
import { ConectionsService } from '../services/connections.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ToolsService } from '../services/tools.service';

@Injectable({
  providedIn: 'root'
})
export class CompleteStepsGuard implements CanActivate {

  constructor(
    private localStorageService:LocalStorageService,
    private router:Router,
    private conectionsService: ConectionsService,
    private toolsService: ToolsService,
  ){

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return new Promise<boolean>( async (resolve, reject) => {
        this.localStorageService
          .get(environment['user_tag'])
          .then(userStoraged => {               
            this.conectionsService
              .get(`user/driver/${userStoraged.id}?populate=*`)
              .subscribe(
                async (res:any) => {
                  console.log(res);
                  
                  const business = res;
                  const basic = res.basic;
                  delete business.basic;
                  (await this.localStorageService.update(environment.user_tag,{...basic,business:business}))                  
                  resolve(true)                  
                },
                async (err: HttpErrorResponse) => {
                  if (err['error'].error.details) {
                    const modalValue = await this.toolsService.showModal({
                      component: SlidesLoginStepsComponent,
                      backdropDismiss: false,
                      keyboardClose: false,
                      cssClass: ['modal-fullscreen'],
                    })
                    console.log(modalValue);
                    
                    if (modalValue) resolve(true);
                    else  this.router.navigateByUrl('auth');resolve(false);
                  }else{
                    this.router.navigateByUrl('auth')
                    reject(false)
                  }
                }
              )
          })
      })
    }
}

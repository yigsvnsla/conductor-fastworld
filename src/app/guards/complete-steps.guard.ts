import { tap } from 'rxjs/operators';
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
    private localStorageService: LocalStorageService,
    private router: Router,
    private conectionsService: ConectionsService,
    private toolsService: ToolsService,
  ) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Promise<boolean>(async (resolve, reject) => {

      const userStoraged = await this.localStorageService.get(environment['user_tag'])
      if ((userStoraged as Object).hasOwnProperty('driver') && userStoraged.driver != null) {
        resolve(true)
      }
      else {
        const foundUser = (await this.conectionsService.get(`driver/user/me`).toPromise() as any)
        if (foundUser.hasOwnProperty('driver') && foundUser.driver) {
          this.localStorageService.set(environment['user_tag'], foundUser);
          resolve(true);
        }
        else {

          const modal = await this.toolsService.showModal({
            component: SlidesLoginStepsComponent,
            backdropDismiss: false,
            keyboardClose: false,
            cssClass: ['modal-fullscreen'],
          })
          console.log(modal);
          const { data, role } = await modal.onWillDismiss();
          if (data) resolve(true);
          else this.router.navigateByUrl('auth'); resolve(false);


          //  else {
          //   this.router.navigateByUrl('auth')
          //   reject(false)
          // }
          // const modal = await this.toolsService.showModal({
          //   component: SlidesLoginStepsComponent,
          //   backdropDismiss: false,
          //   keyboardClose: false,
          //   cssClass: ['modal-fullscreen'],
          //   componentProps:{
          //     foundUser:foundUser
          //   }
          // });
          // modal.present()
          // const { data, role } = await modal.onWillDismiss();
          // if (data) resolve(true);
          // else  this.router.navigateByUrl('auth');resolve(false);
        }
      }

      // const { id } = await this.localStorageService.get(environment['user_tag'])
      // const res = await this.conectionsService.get(`driver/user/me`)
      //   .subscribe()

      // console.log(res);


      // this.localStorageService
      //   .get(environment['user_tag'])
      //   .then( async userStoraged => {
      //     console.log(userStoraged);

      // console.log(await this.conectionsService.get(`driver/user/me`).toPromise());
      // console.log(await this.conectionsService.get(`user/driver/${userStoraged.id}?populate=*`).toPromise());

      //   /* .get(`user/driver/${userStoraged.id}?populate=*`) */
      //   .get(`driver/user/me`)
      //   .subscribe(
      //     async (res: any) => {
      //       /* let business = {...res.driver};
      //       delete res['driver']; */
      //       (await this.localStorageService.update(environment.user_tag,  res))
      // resolve(true)
      //     },
      //     async (err: HttpErrorResponse) => {
      //       if (err['error'].error.details) {
      //         const modalValue = await this.toolsService.showModal({
      //           component: SlidesLoginStepsComponent,
      //           backdropDismiss: false,
      //           keyboardClose: false,
      //           cssClass: ['modal-fullscreen'],
      //         })
      //         console.log(modalValue);

      //         if (modalValue) resolve(true);
      //         else this.router.navigateByUrl('auth'); resolve(false);
      //       } else {
      //         this.router.navigateByUrl('auth')
      //         reject(false)
      //       }
      //     }
      //   )
      // })
    })
  }
}

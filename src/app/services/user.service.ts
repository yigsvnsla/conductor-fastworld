import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {

    private user$ : BehaviorSubject<any>

    constructor(){
        this.user$ = new BehaviorSubject(undefined)
    }

    public get getUser() {
        return this.user$
    }
    
    
    public set setUser(v : any) {
        this.user$.next(v)
    }
    
}

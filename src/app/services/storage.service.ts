import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { KeysResult } from '@capacitor/preferences/dist/esm/definitions'

class Storage {
  public key: string
  public value: any
  public active$: BehaviorSubject<any> = new BehaviorSubject<any | undefined>(undefined);

  constructor(key: string) {
    this.value = {}
    this.key = key


    // this.get(key).then(val=>{
    //   this.active$.next(val)
    // })

  }


  // constructor(private storage: Storage) {
  //   storage.get("thingy").then(t => this.active.next(t));
  // }
  // watch(): Observable<any | undefined> { return this.active$; }
  // peek(): any | undefined { return this.active$.value; }
  // poke(t: any | undefined): void { this.active$.next(t); this.storage.set("thingy", t); }
  // clear(): void { this.poke(undefined); }

  public async check(id: string) {
    // return (await this.getKeys()).keys.includes(id)
    // interface Thingy {...}
    // class ThingyService {

    // }
  }

  // //  To set an item, use set(key, value):
  // public async set(key: string, value: {}) {
  //   if (await this.get(key) == null) {
  //     await Storage.set({ key, value: JSON.stringify(value) });
  //   }// else { this element exist }
  // }
  //To get the item back, use get(name):
  public async get(key: string) {
    let data = await Preferences.get({ key: key });
    return JSON.parse(data.value);
  }
    // }
    // // to update element insert
    // public async update(key: string, value: {}) {
    //   if (await this.get(key) != null) {
    //     await Storage.set({ key, value: JSON.stringify(value) });
    //   } else {
    //     await this.set(key, value);
    //   }
    // }
    // //To remove an item:
    // public async remove(key: string) {
    //   await Storage.remove({ key: key });
    // }
    // //To clear all items:
    // public async clear() {
    //   await Storage.clear();
    // }
    // //To get all keys stored:
    // public async getKeys() {
    //   return await Storage.keys()
    // }
  }

export interface Storages {
  [key: string]: string
}

@Injectable({
  providedIn: 'root',
})

export class StorageService {

  public x: Storages

  private storages: Object = new Object()

  constructor() {
    /*
    *   Si hay llaves almacenadas en el localStorage del navegador, tomamos dicha coleccion de llavez y las pasamos como parametro para 
    *   instanciar el manager de local storage con la data almacenada.
    *   En caso contrario, de no encontrar llaves se procede a instanciar un modelo del manager para el uso del mismo
    **/
    Preferences
      .keys()
      .then((keyResults: KeysResult) => keyResults.keys.length > 0 ? this.prepareStorage(keyResults.keys) : this.createStorage())
  }

  private prepareStorage(keys: string[]): void {
    for (const key of keys) {
      Object.defineProperty(this.storages, key, {
        value: new Storage(key),
        writable: true,
        enumerable: true,
        configurable: true
      })
    }

    console.log(this.storages);
  }

  private createStorage(): void {
    console.log('creating local storage');

  }

  private init() {
    // vericamos si hay llaves almacenadas

    //           //To get all keys stored:
    //   public async getKeys() {
    //     return 
    //   }
  }






}


import { LocalStorageService } from './local-storage.service';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { ToolsService } from './tools.service';
import { CookiesService } from './cookies.service';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { BehaviorSubject, of, Subject, throwError, Observable } from 'rxjs';
import {
  retry,
  catchError,
  debounceTime,
  map,
  tap,
  delay,
  takeUntil
} from 'rxjs/operators';
import { SigInResponseI, SingInRequestI, SingUpI, SingUpResponseI } from '../interfaces/auth.interface';
import { MapDirectionsService, MapGeocoder } from '@angular/google-maps';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';


@Injectable({
  providedIn: 'root',
})
export class ConectionsService {
  // API path
  public readonly api: string = 'https://s1.fastworld.app/api';

  constructor(
    private toolsService: ToolsService,
    private cookiesService: CookiesService,
    private httpClient: HttpClient,
    private router: Router,
    private mapGeocoder: MapGeocoder,
    private localStorageService: LocalStorageService,
    private mapDirectionsService: MapDirectionsService,
  ) {

  }

  // Http Options
  httpHeaders() {
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${(this.cookiesService.get(environment['cookie_tag']))}`,
      }),
    };
  }
  // Handle API errors
  errorHandler(httpErrorResponse: HttpErrorResponse) {
    if (httpErrorResponse.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', httpErrorResponse.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,

      console.error(
        `Backend returned code ${httpErrorResponse.status},
        body was: ${JSON.stringify(httpErrorResponse.error)}`
      );
      this.toolsService.showAlert({
        cssClass: 'alert-danger',
        header: `🚫 Error ${httpErrorResponse.error.error.status}`,
        subHeader: httpErrorResponse.error.error.message,
        message: JSON.stringify(httpErrorResponse.error.error.details),
        buttons: ['ok'],
        backdropDismiss: false
      });
    }
    // return an observable with a user-facing error message
    return throwError(httpErrorResponse);
  }

  // Methods
  public get<t>(path: string, addHeaders = true) {
    return this.httpClient
      .get<t>(`${this.api}/${path}`, addHeaders ? this.httpHeaders() : {})
      .pipe(
        retry(2),
        catchError((err) => this.errorHandler(err))
      );
  }

  public post(path: string, body: any, addHeaders = true) {
    return this.httpClient
      .post<any>(`${this.api}/${path}`, body, addHeaders ? this.httpHeaders() : {})
      .pipe(
        retry(2),
        catchError((err) => this.errorHandler(err))
      );
  }

  public delete(path: string) {
    return this.httpClient
      .delete<any>(`${this.api}/${path}`, this.httpHeaders())
      .pipe(
        retry(2),
        catchError((err) => this.errorHandler(err))
      );
  }

  public put(path: string, body: any) {
    return this.httpClient
      .put<any>(`${this.api}/${path}`, body, this.httpHeaders())
      .pipe(
        retry(2),
        catchError((err) => this.errorHandler(err))
      );
  }

  /*
    Authentications methods
  */

  public signUp(formBody: SingUpI) {
    return this.httpClient
      .post<SingUpResponseI>(`${this.api}/auth/driver/signup`, formBody)
      .pipe(
        debounceTime(500),
        retry(2),
        catchError((err) => this.errorHandler(err))
      );
  }

  public signIn(credentials: SingInRequestI) {
    return this.httpClient
      .post<SigInResponseI>(`${this.api}/auth/driver/signin`, credentials)
      .pipe(
        debounceTime(500),
        retry(2),
        tap(async res => {
          this.cookiesService.set(environment['cookie_tag'], res.jwt);
          (await this.localStorageService.remove(environment['user_tag']));
          (await this.localStorageService.set(environment['user_tag'], res.user));
          this.router.navigateByUrl('dashboard');
        }),
        catchError((err) => this.errorHandler(err))
      )
  }

  public logOut(): void {
    this.cookiesService.remove(environment['cookie_tag']);
    this.router.navigateByUrl('auth');

  }

  // maps methods
  public getGoogleMapsApi() {
    return this.httpClient
      .jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyA4xXPNs8mpyQYKv_6Bxb-A7TLwb9LRZQY&libraries=places&language=es', 'callback')
      .pipe(
        map((x) => true),
        catchError((e) => of(false)),
      );
  }

  public mapDirections(request: google.maps.DirectionsRequest) {
    return this.mapDirectionsService
      .route(request)
      .pipe(
        map(mapDirectionsResponse => {
          const { result, status } = mapDirectionsResponse;
          if (status != google.maps.DirectionsStatus.OK) {
            const translateErrorMessageHandler = (status: google.maps.DirectionsStatus) => {
              switch (status) {
                case google.maps.DirectionsStatus.NOT_FOUND:
                  return `[ ${status} ] Al menos una de las ubicaciones especificadas en el origen, destino o waypoints de la solicitud no se pudo geocodificar.`
                case google.maps.DirectionsStatus.ZERO_RESULTS:
                  return `[ ${status} ] Indica que no se pudo encontrar ninguna ruta entre el origen y el destino.`
                case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
                  return `[ ${status} ] Indica que se proporcionaron demasiados campos "DirectionsWaypoint" en el archivo DirectionsRequest`
                case google.maps.DirectionsStatus.INVALID_REQUEST:
                  return `[ ${status} ]	Indica que lo proporcionado DirectionsRequestno es válido`
                case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                  return `[ ${status} ]	La página web ha superado el límite de solicitudes en un período de tiempo demasiado corto.`
                case google.maps.DirectionsStatus.REQUEST_DENIED:
                  return `[ ${status} ]	La página web no puede usar el servicio de indicaciones.`
                case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                  return `[ ${status} ]	No se pudo procesar una solicitud de "Directions" debido a un error del servidor. La solicitud puede tener éxito si lo intenta de nuevo.`
              }
            }
            this.toolsService.showAlert({
              header: "Error 🚫",
              cssClass: 'alert-danger',
              subHeader: `code: ${status}`,
              message: translateErrorMessageHandler(status),
              buttons: ['Aceptar']
            })
            throwError(`mapGeocoderResponse : ${status}`)
          } else { return result }
        })
      )
  }

  public mapGeocode(request: google.maps.GeocoderRequest) {
    return this.mapGeocoder
      .geocode(request)
      .pipe(
        map(mapGeocoderResponse => {
          const { results, status } = mapGeocoderResponse
          if (status != google.maps.GeocoderStatus.OK) {
            const translateErrorMessageHandler = (status: google.maps.GeocoderStatus) => {
              switch (status) {
                case google.maps.GeocoderStatus.ERROR:
                  return `[ ${status} ]	Hubo un problema al contactar con los servidores de Google.`
                case google.maps.GeocoderStatus.INVALID_REQUEST:
                  return `[ ${status} ]	Este GeocoderRequest no era válido.`
                case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                  return `[ ${status} ]	La página web ha superado el límite de solicitudes en un período de tiempo demasiado corto.`
                case google.maps.GeocoderStatus.REQUEST_DENIED:
                  return `[ ${status} ]	La página web no puede usar el geocodificador.`
                case google.maps.GeocoderStatus.UNKNOWN_ERROR:
                  return `[ ${status} ]	No se pudo procesar una solicitud de geocodificación debido a un error del servidor. La solicitud puede tener éxito si lo intenta de nuevo.`
                case google.maps.GeocoderStatus.ZERO_RESULTS:
                  return `[ ${status} ] No se encontró ningún resultado para esto GeocoderRequest`
              }
            }
            this.toolsService.showAlert({
              header: "Error 🚫",
              cssClass: 'alert-danger',
              subHeader: `code: ${status}`,
              message: translateErrorMessageHandler(status),
              buttons: ['Aceptar']
            })
            throwError(`mapGeocoderResponse : ${status}`)
          } else { return results }
        })
      )
  }

  public postStream(path: string, obj) {
    return this.httpClient
        .post(`${this.api}/${path}`,obj, {
            headers: {
              'Authorization': `Bearer ${(this.cookiesService.get(environment['cookie_tag']))}`
            },
            responseType: 'arraybuffer'
        })
        .pipe(
            retry(2),
            catchError((err) => this.errorHandler(err))
        )
}

  public geolocation(geolocationCallback: (x: GeolocationPosition | undefined) => any) {
    if (navigator.geolocation) {
      navigator.geolocation
        .getCurrentPosition(
          (geolocationPosition: GeolocationPosition) => {
            return geolocationCallback(geolocationPosition)
          },
          (geolocationPositionError: GeolocationPositionError) => {
            switch (geolocationPositionError.code) {
              case geolocationPositionError.PERMISSION_DENIED:
                this.toolsService.showAlert({
                  header: "Ubicacion bloqueada",
                  cssClass: 'alert-danger',
                  subHeader: "Permiso denegado",
                  message: "Los permisos para obtener la ubicacion y manejar el mapa, estan denegados por el usuario o dispositivo",
                  buttons: ['Aceptar']
                })
                break;
              case geolocationPositionError.POSITION_UNAVAILABLE:
                this.toolsService.showAlert({
                  header: "Posicion no disponible",
                  subHeader: "Mapa no disponible",
                  cssClass: 'alert-warn',
                  message: "Ha ocurrido algun problema con el dispositivo movil",
                  buttons: ['Aceptar']
                })
                break;
            }
            console.error(geolocationPositionError);
            return geolocationCallback(undefined)
          }, {
          enableHighAccuracy: true,
        })
    }
  }

}

export class Source extends DataSource<any | undefined>{
  public source: any[] = Array.from<any>({ length: 0 });
  private itemsChanges$: BehaviorSubject<any>
  private destroy$: Subject<boolean> = new Subject();

  private path: string
  private pagination: {
    page: number
    pageSize?: number
    pageCount?: number
    total?: number
  }

  public loading: BehaviorSubject<boolean>

  constructor(
    public _path: string,
    private _conectionsService: ConectionsService,
  ) {

    super()
    this.itemsChanges$ = new BehaviorSubject<(string | undefined)[]>(this.source);
    this.setPath = _path
    this.setPagination = { page: 1 }
    this.loading = new BehaviorSubject<boolean>(false)
    this.getInformation()
  }

  private async getData(path: string) {
    return await this._conectionsService
      .get<any>(path + `&pagination[page]=${this.getPagination.page}`)
      .pipe(delay(1000))
      .toPromise()
  }

  private get getPagination(): {
    page: number
    pageSize?: number
    pageCount?: number
    total?: number
  } { return this.pagination }

  private set setPagination(v: {
    page: number
    pageSize?: number
    pageCount?: number
    total?: number
  }) {
    this.pagination = v;
  }

  public set setPath(v: string) {
    this.path = v;
  }

  private async binarySearch(vector: any[], dato: number): Promise<number> {
    let mid = 0
    let left = 0;
    let rigth = vector.length - 1
    while (left <= rigth) {
      mid = Math.round((left + rigth) / 2)
      if (vector[mid] == undefined) return -1;
      if (vector[mid].id == dato) { return mid; }
      if (dato > vector[mid].id) { rigth = mid - 1 }
      if (dato < vector[mid].id) { left = mid + 1 }
    }
    return -1;
  }

  public async updateItemToSource(id:number,value:any){
    let index = await this.binarySearch(this.source, id);
    this.source[index] = value
    this.itemsChanges$.next(this.source)
  }

  public varRef:any = {}

  // encolar
  public async addItemToSource(item?: any) {
    // this.varRef.id = this.varRef.id + 1;
    this.source.unshift({...item})
    this.itemsChanges$.next(this.source)
  }

  // desencolar :check:
  public async deleteItemToSource(id: number, index?:number) {
    let find = await this.binarySearch(this.source, id);
    let substract = this.source.splice(index?index:find, 1);
    if (id == -1 && !substract.length) console.error('error update source');
    this.itemsChanges$.next(this.source)
  }


  private async getInformation() {
    this.loading.next(true)
    const { data, meta } = await this.getData(this.path)
    const { page, pageSize, pageCount, total } = meta.pagination
    this.pagination = meta.pagination
    this.source.splice(page * pageSize, pageSize, ...data);
    this.varRef = {...data[0]}
    // console.log(this.varRef);
    // console.log(data);

    this.itemsChanges$.next(this.source);
    this.loading.next(false)
  }

  public connect(collectionViewer: CollectionViewer) {
    collectionViewer.viewChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((range) => {
        const currentPage = Math.floor(range.end / this.pagination.pageSize) + 1;
        if (currentPage > this.pagination.page) {
          this.pagination.page = currentPage;
          this.getInformation()
        }
      })
    return this.itemsChanges$
  }

  public disconnect(collectionViewer: CollectionViewer): void {
    this.destroy$.next(true)
  }

}

/**
 * Script para generar y manejar estructuras de datos FIFO `First in, First Out`
 * de manera agnostica a los datos insertados a la cola
 * @author Yigsvnsla <https://github.com/yigsvnsla>
 * @version 0.1
 */
 export class Queue<T extends { [key: string]: any }> {
  /**
   * @protected  Array donde se almaceran los objetos para la cola
   */
  protected _queue: T[]

  /**
   * @protected Posicion del puntero inicial
   */
  protected _front: number

  /**
   * @protected Posicion del puntero final
   */
  protected _rear: number

  /**
   * @protected Longitud de la cola
   */
  protected _length: number | undefined;

  /**
   *  inicializar la cola con un tamaño definido, o con valores ya pre-establecidos
   * @param { T[]} _arg1 valores inciales
   * @example <caption>Ejemplo de uso con un Arreglo pre-establecido.</caption>
   * const _data = [...]
   * const source = new Queue<any>(_data)
   * // Valores insertados a la cola | console.log(source)
  */
  constructor(_arg1: T[])
  /**
   * Inicializar la cola con una longitud especifica, dejando las posiciones vacias
   * @param {config} _arg1 Establecer longitud inicial
   * @example <caption>Ejemplo de una longitud pre-establecida </caption>
   * const source = new Queue<any>({length:10})
   * // this._length = 10 | console.log(source)
   */
  constructor(_arg1: config)
  /**
   *
   */
  constructor(_arg1: T[] | config) {

      // Inicializamos los valores iniciales de la cola
      this._queue = []
      this._front = 0
      this._rear = 0
      this._length = 0
      // si es un arreglo usa una funcion propia para meter a la cola cada elemento
      if (Array.isArray(_arg1)) {
          this._length = undefined
          this.enqueue('front', _arg1)
      }
      // en caso contrario si es un objeto de configuracion
      // establece los valores del mismo
      else if (!Array.isArray(_arg1) && typeof _arg1 == 'object') {
          this._length = _arg1.length
          this._queue = Array.from({ length: (_arg1.length != null) ? _arg1.length : 0 })
      }
  }

  /**
   * @return {T} Obtiene el elemento al principio de la cola sin eliminarlo
   */
  public get peek(): T {
      return this._queue[this._front]
  }

  /**
   * @returns {T[]} Obtener inmutable de la cola
   */
  public get values(): T[] {
      return this._queue
  }

  /**
   * @returns {number} Obtener largo de la cola
   */
  public get size(): number | undefined {
      return this._length
  }

  /**
   * @param {T} _data Meter al final de la cola
   */
  private set _rearEnqueue(_data: T) {
      this._queue[this._rear] = _data;
      this._rear += 1
  }

  /**
   * @param {T} _data Meter al inicio de la cola
   */
  private set _frontEnqueue(_data: T) {
      this._queue[this._rear] = _data;
      this._rear += 1
  }

  /**
   * Retorna el valor del puntero, dejando libre la posicion del la cola sin alterar la longitud
   * @returns {T} extrae y elimina el elemento del puntero _front_
   */
  private get _frontDequeue(): T {
      const data = this._queue[this._front]
      delete this._queue[this._front]
      this._front += 1
      return data
  }

  /**
   * Retorna el valor del puntero, dejando libre la posicion del la cola sin alterar la longitud
   * @returns {T} extrae y elimina el elemento del puntero _rear_
   */
  private get _rearDequeue(): T {
      const data = this._queue[this._rear - 1]
      delete this._queue[this._rear - 1]
      this._rear -= 1
      return data
  }

  /**
   * @returns {T} Obtiene una referencia inmutable del elemento a salir de la cola
   */
  public peekByIndex(number: number): T {
      return this._queue[number]
  }

  /**
   * Retorna el valor del puntero, dejando libre la posicion del la cola sin alterar la longitud
   * @param {number} index posicion del elemento en la cola
   * @returns {T} extrae y elimina el elemento del puntero _front_
   */
  public dequeueByIndex(index: number): T {
      const data = this._queue[index]
      delete this._queue[index]
      this._rear -= 1
      return data
  }

  /**
   * metodo publico que  agrega (almacena) un elemento a la cola.
   * @param {T} data Valores a meter a la cola
   * @param {'rear' | 'front'} position posicion de desde la cual meter los elementos
   * @throws ``Cola Llena`` intento de desbordamiento
   * @example <caption>Importante ingresar en que posicion meter los elementos a la cola </caption>
   * source.enqueue('rear', {id: 12,attributes: {} } )
   */
  public enqueue(position: 'rear' | 'front', data: T): void
  /**
   * metodo publico que  agrega (almacena) un elemento a la cola.
   * @param {T[]} data Valores a meter a la cola
   * @param {'rear' | 'front'} position posicion de desde la cual meter los elementos
   * @throws ``Cola Llena`` intento de desbordamiento
   * @example <caption>Importante ingresar en que posicion meter los elementos a la cola </caption>
   * const newData: T[]  = [{id: 12,attributes: {} }, ...[] ]
   * source.enqueue('rear', newData )
   */
  public enqueue(position: 'rear' | 'front', data: T[]): void
  /**
   *
   */
  public enqueue(position: 'rear' | 'front', data: T | T[]): void {
      try {
          if (this.isfull()) throw new Error(`<enqueue> Cola llena, intento de desbordamiento \n <value> ${data}`);
          if (position == 'front') {
              if (Array.isArray(data)) { data.forEach((value) => this._frontEnqueue = value); return }
              if (!Array.isArray(data)) { this._frontEnqueue = data; return }
          }
          if (position == 'rear') {
              if (Array.isArray(data)) { data.forEach((value) => this._rearEnqueue = value); return }
              if (!Array.isArray(data)) { this._rearEnqueue = data; return }
          }
      } catch (error) {
          console.log(error);
      }
  }

  /**
   * metodo publico que  agrega (almacena) un elemento a la cola.
   * @param {number} _cant Cantidad de elementos a eliminar
   * @param {'rear' | 'front'} position posicion de desde la cual sacar los elementos
   * @returns {T | T[] |null} Retorna un Arreglo de los elementos eliminados sin modificar la longitud de la cola
   * @throws ``Cola Vacia`` intento de sub-desbordamiento
   * @example <caption>Importante ingresar en que posicion meter los elementos a la cola </caption>
   * source.enqueue('rear', 5 )
  */
  public dequeue(position: 'rear' | 'front', _cant: number = 0): T | T[] | null {
      try {
          if (this.isempty()) throw new Error(`<enqueue> Cola Vacia, intento de subDesbordamiento`);
          if (_cant < 0) throw new Error("cantidad de posiciones invalidas ( solo numeros positivos )");
          if (position == 'front') {
              if (_cant > 0) { return Array.from({ length: _cant }).map(value => this._frontDequeue) }
              if (_cant == 0) { return this._frontDequeue }
          }
          if (position == 'rear') {
              if (_cant > 0) { return Array.from({ length: _cant }).map(value => this._rearDequeue) }
              if (_cant == 0) { return this._rearDequeue }
          }
      } catch (error) {
          console.log(error);
      }
      return null
  }

  /**
   * @returns {boolean} comprueba si la cola está llena.
   */
  public isfull(): boolean {
      if (this._length == null) return false;
      if (this._length != null) return (this._rear == this._length);
      return false
  }

  /**
   * @returns {boolean} comprueba si la cola está vacía.
   */
  public isempty(): boolean {
      return ((this._rear <= 0))
  }

  /**
   * Actualiza los valores de una posicion de la cola mediante su indice
   * @param {number} index Posicion del elemento en la cola
   * @param {T} value Vaalor a actualizar en el elemento
   */
  public updateByIndex(index: number, value: T) {
      if (index >= 0 && index <= this._queue.length) {
          this._queue[index] = value
      }
      else console.error('error upddatebyIndex')
  }

  /**
   * Funcion para actualizar
   * todas las propiedades que coincidan con el escalón del objeto
   * segun los indices del array
   * @param {Array<string>} _arrKeys Niveles de los escalones
   * @param {{[key:string:any]}} updateValue Valor a actualizar
   * @example <caption>Actualizar los elementos a la cola con un arreglo</caption>
   * const source = new Queue()
   * ...
   * const newData: T[]  = [{id: 12,attributes: {} }, ...[] ]
   * source.updateByFind(['attributes','name'], newData )
   */
  public updateByFind(_arrKeys: string[], updateValue: { [key: string]: any }): void
  /**
   * Funcion para actualizar
   * todas las propiedades que coincidan con el objeto
   * @param {{[key:string]:any}} _objectReference Objeto de referencia
   * @param {{[key:string]:any}} updateValue Valor a actualizar
   * @example <caption>Actualizar los elementos a la cola con un arreglo</caption>
   * const source = new Queue()
   * ...
   * const reference: T = {id: 12,attributes: {...} }
   * const newData: any = { dato1,dato2:{ dato2_1, dato2_2}, {...} }
   * source.updateByFind(reference, newData )
   */
  public updateByFind(_objectReference: { [key: string]: any }, updateValue: { [key: string]: any }): void
  /**
   *
   */
  public updateByFind(_arg1: string[] | { [key: string]: any }, updateValue: { [key: string]: any }): void {
      try {
          /**
           * Función recursiva para filtrar y devolver elementos
           * cuyas propiedades hagan match con la llave (Key) asignada como argumento
           * @param {string} key Llave con la que hacer match
           * @param {any[]} arr  Arreglo de objetos a filtrar
           * @returns {any[]} Retorna un arreglo de referencias filtradas para hacer match con la _key_
           */
          const findToArray = (key: string, arr: any[]): any[] => {
              //creamos una lista de referencias
              let returned: any[] = [];
              // iteramos sobre el argumento a filtrar
              for (let index = 0; index < arr.length; index++) {
                  const element = arr[index];
                  // si este elemento existe returna un objeto
                  // con el indice y el valor de esta posicion de la cola
                  if (element.hasOwnProperty.call(element.value, key)) {
                      returned.push({ index: element.index, value: element.value[key] })
                  }
              }
              return returned;
          }

          /**
           * Funcion recursiva para comparar objetos de manera profunda en sus propiedades
           * @param {{[key:string]:any}} objet_base Objeto con la cual tener una referencia
           * @param {{[key:string]:any}} objet_compare Objeto con la cual comparar segun la referencia
           * @returns {boolean} si encuentra una coincidencia en las propiedades retorna `true`, en caso contrario `false`
           */
          const compareObjets = (objet_base: { [key: string]: any }, objet_compare: { [key: string]: any }): boolean => {
              for (let [key, val] of Object.entries(objet_base)) {
                  // si esta propiedad existe
                  if (objet_compare.hasOwnProperty(key)) {
                      // si el valor de la llave en el objeto comparador es diferente
                      if (objet_compare[key] !== val) {
                          // si el valor de la llave es de tipo objeto,
                          // aplicar recursividad a la funcion, asi hacemos un sondeo profundo a las propiedades
                          if (typeof objet_compare[key] == 'object') {
                              return compareObjets(objet_compare[key], val)
                          }
                          // Propiedad ${key}: El valor ${objet_compare[key]} no es equivalente a ${val}
                          return false;
                      }
                  }
                  // esta propiedad no existe en el objeto comparador;
                  else return false;
              }
              return true
          }

          // si el argumento es un arreglo, busca todos los elementos de la cola que tengan como propiedades
          // las mismas keys asignadas en el argumento __arg1_ y actualiza su valor a los establecidos en el argumento _updateValue_
          if (Array.isArray(_arg1)) {
              // creamos un diccionario de referencias
              let matchList: { [key: string]: any }[] = []
              // volcamos el diccionario las referencias
              for (let _indexQueue = 0; _indexQueue < this._queue.length; _indexQueue++) {
                  const value = this._queue[_indexQueue];
                  const index = _indexQueue;
                  matchList.push({ index, value })
              }
              // iteramos sobre el argumento pasandole como parametro
              // a la funcion `findToArray` el valor de la posicion del arreglo _(Key)_
              // y segun lo que retorne dicha funcion se actualiza el diccionario de referencias
              for (let _indexArg1 = 0; _indexArg1 < _arg1.length; _indexArg1++) {
                  const key = _arg1[_indexArg1];
                  matchList = findToArray(key, matchList);
              }
              // iteramos una vez mas sobre el resultado sobrante en el diccionario de referecias
              // `matchList`, y actualizamos el elemento de la cola con la que se hicieron match
              for (let _indexmatchList = 0; _indexmatchList < matchList.length; _indexmatchList++) {
                  const index = matchList[_indexmatchList].index;
                  (this._queue[index] as any) = updateValue
              }
          }
          else {
              // si el argumento no es un arreglo, pero es un objeto... busca en la cola elementos que sean
              // iguales el argumento para luego actualizar su valor
              if (typeof _arg1 === 'object') {
                  // iteramos sobre la cola tomando los elementos de cada ciclo en una varaible de referencia `item`
                  for (let _queueIndex = 0; _queueIndex < this._queue.length; _queueIndex++) {
                      const item = this._queue[_queueIndex];
                      // iteramos sobre cada propiedad de la referencia, para luego iterar sobre las propiedades del argumento
                      // y asi poder pasarlos por parametro a la funcion `compareObjets`
                      for (let [key_base, val_base] of Object.entries(_arg1)) {
                          for (let [key_compare, val_compare] of Object.entries(item)) {
                              if (key_base === key_compare) {
                                  if (typeof val_base == 'object' && typeof val_compare === 'object') {
                                      // si la funcion hace `match` actualizamos la posicion del elemento en la cola
                                      if (compareObjets(val_base, val_compare)) {
                                          (this._queue[_queueIndex] as any) = updateValue
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
              else throw new Error("Tipos de datos invalidos, esta funcion solo recibe Arreglos u objetos como parametros");

          }
      } catch (error) { console.error(error); }

  }

  /**
   * Funcion para buscar las propiedades que coincidan con el escalón del objeto
   * segun los indices del array
   * @param {Array<string>} _arrKeys Niveles de los escalones
   * @returns {T} Retorna un arrglo con los elementos semejantes a las keys dadas
   * @example <caption>Buscar los elementos a la cola con un arreglo</caption>
   * const source = new Queue()
   * ...
   * source.find(['attributes','name'])
   */
  public find(_arrKeys: string[]): T[];
  /**
   * Funcion para actualizar
   * todas las propiedades que coincidan con el objeto
   * @param {{[key:string]:any}} _objectReference Objeto de referencia
   * @returns {T} Retorna un arrglo con los elementos semejantes a las keys dadas
   * @example <caption> Buscar los elementos a la cola con una referencia </caption>
   * const source = new Queue()
   * ...
   * const reference: T = {id: 12,attributes: {...} }
   * source.updateByFind(reference)
   */
  public find(_objectReference: { [key: string]: any }): T[];
  /**
   *
   */
  public find(_arg1: string[] | { [key: string]: any }): unknown {
      try {
          /**
           * Función recursiva para filtrar y devolver elementos
           * cuyas propiedades hagan match con la llave (Key) asignada como argumento
           * @param {string} key Llave con la que hacer match
           * @param {any[]} arr  Arreglo de objetos a filtrar
           * @returns {any[]} Retorna un arreglo de referencias filtradas para hacer match con la _key_
          */
          const findToArray = (key: string, arr: any[]): any[] => {
              let returned: any[] = [];
              for (let index = 0; index < arr.length; index++) {
                  const element = arr[index];
                  if (element.hasOwnProperty.call(element.value, key)) {
                      returned.push({
                          index: element.index,
                          value: element.value[key]
                      })
                  }
              }
              return returned;
          }
          /**
           * Funcion recursiva para comparar objetos de manera profunda en sus propiedades
           * @param {{[key:string]:any}} objet_base Objeto con la cual tener una referencia
           * @param {{[key:string]:any}} objet_compare Objeto con la cual comparar segun la referencia
           * @returns {boolean} si encuentra una coincidencia en las propiedades retorna `true`, en caso contrario `false`
          */
          const compareObjets = (objet_base: { [key: string]: any }, objet_compare: { [key: string]: any }): boolean => {
              for (let [key, val] of Object.entries(objet_base)) {
                  // si esta propiedad existe
                  if (objet_compare.hasOwnProperty(key)) {
                      // si el valor de la llave en el objeto comparador es diferente
                      if (objet_compare[key] !== val) {
                          // si el valor de la llave es de tipo objeto,
                          // aplicar recursividad a la funcion, asi hacemos un sondeo profundo a las propiedades
                          if (typeof objet_compare[key] == 'object') {
                              return compareObjets(objet_compare[key], val)
                          }
                          // console.error(`Propiedad ${key}: El valor ${objet_compare[key]} no es equivalente a ${val}`);
                          return false;
                      }
                  }
                  // si esta propiedad no existe
                  else {
                      // console.error(key, `propiedad no existe en el objeto comparador`);
                      return false;
                  }
              }
              return true
          }
          // si el argumento es un arreglo, busca todos los elementos de la cola que tengan como propiedades
          // las mismas keys asignadas en el argumento __arg1_ y actualiza su valor a los establecidos en el argumento _updateValue_
          if (Array.isArray(_arg1)) {
              // creamos un diccionario de referencias
              let matchList: { [key: string]: any }[] = []
              // volcamos el diccionario las referencias
              for (let _indexQueue = 0; _indexQueue < this._queue.length; _indexQueue++) {
                  const value = this._queue[_indexQueue];
                  const index = _indexQueue;
                  matchList.push({ index, value })
              }
              // iteramos sobre el argumento pasandole como parametro
              // a la funcion `findToArray` el valor de la posicion del arreglo(Key)
              // y segun lo que retorne dicha funcion se actualiza el diccionario de referencias
              for (let _indexArg1 = 0; _indexArg1 < _arg1.length; _indexArg1++) {
                  const key = _arg1[_indexArg1];
                  matchList = findToArray(key, matchList);
              }
              // iteramos una vez mas sobre el resultado sobrante en el diccionario de referecias
              // `matchList`, y actualizamos el elemento de la cola con la que se hicieron match
              for (let _indexmatchList = 0; _indexmatchList < matchList.length; _indexmatchList++) {
                  const index = matchList[_indexmatchList].index;
                  matchList[_indexmatchList].value = this._queue[index];
              }
              return matchList
          }
          else {
              // si el argumento no es un arreglo, pero es un objeto... busca en la cola elementos que sean
              // iguales el argumento para luego actualizar su valor
              if (typeof _arg1 === 'object') {
                  // incializamos un arreglo para convertirlo en un diccionario de referencias
                  let matchList: any[] = []
                  // iteramos sobre la cola tomando los elementos de cada ciclo en una varaible de referencia `item`
                  for (let _queueIndex = 0; _queueIndex < this._queue.length; _queueIndex++) {
                      const item = this._queue[_queueIndex];
                      // iteramos sobre cada propiedad de la referencia, para luego iterar sobre las propiedades del argumento
                      // y asi poder pasarlos por parametro a la funcion `compareObjets`
                      for (let [key_base, val_base] of Object.entries(_arg1)) {
                          for (let [key_compare, val_compare] of Object.entries(item)) {
                              if (key_base === key_compare) {
                                  // si la funcion hace `match` empujamos el elemento en la cola a el diccionario de referencias
                                  if (typeof val_base == 'object' && typeof val_compare === 'object') {
                                      if (compareObjets(val_base, val_compare)) {
                                          matchList.push({
                                              index: _queueIndex,
                                              value: item
                                          })
                                      }
                                  }
                              }
                          }
                      }
                  }
                  return matchList
              } else {
                  throw new Error("Tipos de datos invalidos, esta funcion solo recibe Arreglos u objetos como parametros");
              }
          }
      } catch (error) { console.error(error); }
  }


}

/**
* Interface de configuracion al momento de instanciar una cola
*/
interface config { length: undefined | number }

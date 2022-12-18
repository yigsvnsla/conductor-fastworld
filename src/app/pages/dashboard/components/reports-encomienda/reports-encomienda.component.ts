import { ToolsService } from './../../../../services/tools.service';
import { IonDatetime } from '@ionic/angular';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { startOfMonth, endOfDay, startOfDay, startOfWeek, format } from 'date-fns';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { environment } from 'src/environments/environment';
import { ConectionsService } from 'src/app/services/connections.service';

@Component({
  selector: 'app-reports-encomienda',
  templateUrl: './reports-encomienda.component.html',
  styleUrls: ['./reports-encomienda.component.scss'],
})
export class ReportsEncomiendaComponent implements OnInit {
  /*
    @ViewChild('dateTimeRange') public dateTimeRange: IonDatetime

    public reportForm: FormGroup

    constructor(
      private formBuilder: FormBuilder,
      private toolsService:ToolsService
    ) {


    }

    public ngOnInit() {
      this.reportForm = this.formBuilder.nonNullable.group({
        start: [startOfMonth(new Date()).toISOString()],
        end: [new Date(Date.now()).toISOString()],
        type: ['',[Validators.required]]
      })

    }

    public ionViewWillEnter() {
      console.log(this.reportForm.status);

    }

    public modalWillPresent() {
      const { start, end } = this.reportForm.value
      this.dateTimeRange.max = end
      this.dateTimeRange.value = [start, end]
    }


    public loading: boolean

    public async changeDateRate($event: Event): Promise<void> {
      const event = $event as CustomEvent<IonDatetime>
      const value = event.detail.value as Array<string>
      const { start, end } = this.reportForm.value

      if (value == undefined || value.length == 1 ) {
        await this.toolsService.showAlert({
          header:'Alerta ⚠',
          subHeader:'solo puede selecionar dos fechas para generar su reporte',
          cssClass:'alert-warning',
          buttons:['cancel',{
            text:'aceptar',
            handler: () => {
              this.dateTimeRange.value = [start, end]
            },
          }]
        })
        return
      }

      if ( !this.loading ) {
        this.loading = true
        // console.log(value);
        value.shift();
        this.dateTimeRange.value = [value[0], value[1]]
        this.reportForm.get(['start']).setValue(value[0])
        this.reportForm.get(['end']).setValue(value[1])
        this.loading = false
      }

    }

    public onSubmit(): void{

    } */


  public reportForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private toolsService: ToolsService,
    private localStorageService: LocalStorageService,
    private http: ConectionsService
  ) {


  }

  public ngOnInit() {
    this.reportForm = this.formBuilder.nonNullable.group({
      start: ['', Validators.required],
      end: ['', Validators.required],
      type: ['', [Validators.required]]
    })

  }

  async onSubmit() {
    let basic = await this.localStorageService.get(environment['user_tag']);
    const { type } = this.reportForm.value
    await this.getExport(basic.id, type, this.reportForm.value)

  }

  selectChange(event) {
    const { value } = event.detail;
    if (value == '4') {
      return;
    }
    let dateStart: Date;
    let dateEnd: Date;
    switch (value) {
      case '1':
        dateStart = startOfDay(new Date())
        dateEnd = endOfDay(new Date())
        break;
      case '2':
        dateStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        dateEnd = endOfDay(new Date())
        break;
      case '3':
        dateStart = startOfMonth(new Date())
        dateEnd = endOfDay(new Date())
        break;
      default:
        break;

    }
    this.reportForm.get('start').patchValue(format(dateStart, 'yyyy-MM-dd'))
    this.reportForm.get('end').patchValue(format(dateEnd, 'yyyy-MM-dd'))
  }

  /*Modals handlers */
  async dateClose(datetime: IonDatetime, target) {
    await datetime.confirm(true);
    let date = datetime.value.toString().split("T")[0]
    this.reportForm.get(target).patchValue(date)
  }


  async getExport(id: any, type: string, data: any) {
    const loading = await this.toolsService.showLoading('Cargando informacion...')
    try {
      let response = await this.http.postStream(`report/${id}`, data).toPromise()
      let name = new Date().toString()
      let file = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      var a = document.createElement("a"), url = URL.createObjectURL(file);
      a.href = url;
      a.download = `${name}.xlsx`;
      // const response = await this.connectionsService.post(`packages/client`, { client: this.userID, packages: this.productList$.value }).toPromise();
      if (response) {
        await this.toolsService.showAlert({
          cssClass: 'alert-success',
          keyboardClose: true,
          mode: 'ios',
          header: 'Exito',
          buttons: [{ text: 'Aceptar', handler: () => a.click() }]
        })
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading.dismiss()
    }
  }

}

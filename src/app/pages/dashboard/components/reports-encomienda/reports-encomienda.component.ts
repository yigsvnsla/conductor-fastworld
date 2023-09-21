import { ToolsService } from './../../../../services/tools.service';
import { IonDatetime, Platform } from '@ionic/angular';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { startOfMonth, endOfDay, startOfDay, startOfWeek, format } from 'date-fns';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { environment } from 'src/environments/environment';
import { ConectionsService } from 'src/app/services/connections.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const MimeTypes = [
  {
    name: 'excel',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  {
    name: 'pdf',
    type: 'application/pdf',
    extension: '.pdf',
  },
]

@Component({
  selector: 'app-reports-encomienda',
  templateUrl: './reports-encomienda.component.html',
  styleUrls: ['./reports-encomienda.component.scss'],
})
export class ReportsEncomiendaComponent implements OnInit {

  public reportForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private toolsService: ToolsService,
    private localStorageService: LocalStorageService,
    private http: ConectionsService,
    private platform: Platform
  ) {


  }

  public ngOnInit() {
    this.reportForm = this.formBuilder.nonNullable.group({
      start: ['', Validators.required],
      end: ['', Validators.required],
      type: ['pdf', [Validators.required]],
      target: ['balance', [Validators.required]]
    })

  }

  async onSubmit() {
    let loading = await this.toolsService.showLoading("Generando archivo...")
    try {
      let basic = await this.localStorageService.get(environment['user_tag']);
      const { type, target, start, end } = this.reportForm.value
      let all = new Date(start).getFullYear() == 2020;
      if (target == 'packages') {
        let route = `report/${type}/${basic.id}`;
        await this.downloader({
          data: { ...this.reportForm.value, all },
          route,
          name: `Listado rutas - ${format(new Date(), 'dd-MM-yyyy')}`
        }, type)
        return
      }

      let paramStart = startOfDay(this.toolsService.satinizeDate(new Date(start), true)).toISOString()
      let paramEnd = endOfDay(this.toolsService.satinizeDate(new Date(end), true)).toISOString()
      await this.downloader({
        data: {
          mode: 'drivers',
          current: basic.id,
          day: [paramStart, paramEnd]
        },
        route: `finances/${type}`,
        name: `Record balance - ${format(new Date(), 'dd-MM-yyyy')}`
      }, type)
    } catch (error) {
      console.log("Error intentando descargar archivo")
      this.toolsService.showToast({
        message: '¡Error al descargar!',
        color: 'danger'
      })
    } finally {
      loading.dismiss()
    }
  }

  selectChange(event) {
    const { value } = event.detail;
    if (value == '4') {
      return;
    }
    let dateStart: Date;
    let dateEnd: Date;
    switch (value) {
      case '0':
        dateStart = this.toolsService.satinizeDate(new Date('2020-01-01'), true)
        dateEnd = endOfDay(new Date())
        break;
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
    console.log(this.reportForm.value)
  }

  /*Modals handlers */
  async dateClose(datetime: IonDatetime, target) {
    await datetime.confirm(true);
    let date = datetime.value.toString().split("T")[0]
    this.reportForm.get(target).patchValue(date)
  }



  async downloader({ data, name, route }, mime) {
    let mimeType = MimeTypes.find(e => e.name == mime)
    let response = await this.http.postStream(route, data).toPromise()
    let file = new Blob([response], { type: mimeType.type })
    var a = document.createElement("a"), url = URL.createObjectURL(file);
    a.href = url;
    a.download = `${name}${mimeType.extension}`;

    if (response && !this.platform.is('android') || !this.platform.is('mobile')) {
      a.click()
      return;
    }


    Filesystem.checkPermissions().then(async res => {
      if (res.publicStorage == 'granted') {
        this.http.writeFileSystem(file,name)
      } else {
        let response = await Filesystem.requestPermissions()
        if (response.publicStorage == 'granted') {
          this.http.writeFileSystem(file,name)
        }
      }
    })
  }

}

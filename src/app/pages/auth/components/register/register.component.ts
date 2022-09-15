import { ConectionsService } from 'src/app/services/connections.service';
import { IonItemGroup } from '@ionic/angular';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ToolsService } from 'src/app/services/tools.service';
import { format, isValidPhoneNumber } from 'libphonenumber-js';
import { CupertinoPane } from 'cupertino-pane';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {

  @ViewChild('formRegisterRef') public formRegisterRef: IonItemGroup
  @Input() pane: CupertinoPane
  public formRegister: FormGroup
  public loading: boolean
  constructor(
    private toolsService: ToolsService,
    private conectionsService: ConectionsService,
    private formBuilder: FormBuilder,
  ) { }

  public ngOnInit() {
    this.loading = false
    this.formRegister = this.formBuilder.nonNullable.group({
      documents: this.formBuilder.nonNullable.group({
        code: ['', [
          Validators.required,
          Validators.nullValidator, 
          Validators.pattern(/(^\d{9}$|^\d{13}$)/),
          (codeControl:AbstractControl<number>)=>{
            if (codeControl.value != null){
              let val:string = codeControl.value.toString()
              if (val != '') {
                if ( val.length == 9 ) this.formRegister.get('documents').get('type').setValue('dni');
                if ( val.length == 13 ) this.formRegister.get('documents').get('type').setValue('ruc');
                if ( !(RegExp(/(^\d{9}$|^\d{13}$)/).test(val)) ) this.formRegister.get('documents').get('type').reset();
                return null
              }
            }
          }
        ]],
      //   image: ['null'],
        type: [null,[]]
      }),
      name: ['', [Validators.required, Validators.nullValidator]],
      lastname: ['', [Validators.required, Validators.nullValidator]],
      phone: ['', [
        Validators.required,
        Validators.nullValidator,
        (phoneControl: AbstractControl<string>) => {
          if (phoneControl['value'] != '') {
            if (RegExp(/ /).test(phoneControl['value'])) phoneControl.patchValue(phoneControl['value'].replace(/ /, ''));
            if (RegExp(/^[0-9]{10}$/).test(phoneControl['value'])) phoneControl.setValue(format(phoneControl['value'], 'EC', 'INTERNATIONAL').replace(/ /, ''));
            if (RegExp(/^[+]{1}[0-9]{12}$/).test(phoneControl['value']) && isValidPhoneNumber(phoneControl['value'])) return null;
            return { notIsValidPhoneNumber: true };
          }
        }
      ]],
      mail: ['', [
        Validators.required,
        Validators.nullValidator,
        Validators.email,
        Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
      ]],
      password: ['', [Validators.required, Validators.nullValidator]],
    })
  }

  public enterOrGo() {
    if (!this.formRegister.valid) {
      for (const keyC1 in this.formRegisterRef['el']['children']) {
        if (Object.prototype.hasOwnProperty.call(this.formRegisterRef['el']['children'], keyC1)) {
          if (this.formRegisterRef['el']['children'][keyC1]['localName'] == 'ion-item') {
            for (const keyC2 in this.formRegisterRef['el']['children'][keyC1]['children']) {
              if (Object.prototype.hasOwnProperty.call(this.formRegisterRef['el']['children'][keyC1]['children'], keyC2)) {
                if (this.formRegisterRef['el']['children'][keyC1]['children'][keyC2]['localName'] == 'ion-input') {
                  if ((this.formRegisterRef['el']['children'][keyC1]['children'][keyC2] as HTMLIonInputElement).value == '') {
                    (this.formRegisterRef['el']['children'][keyC1]['children'][keyC2] as HTMLIonInputElement).setFocus()
                    return
                  }
                }
              }
            }
          }
        }
      }
    } 
    else this.onRegister()
  }

  public onRegister() {
    this.loading = true
    this.conectionsService
      .signUp(this.formRegister.value)
      .subscribe((response) => {
        console.log(response);
        this.toolsService.showAlert({
          header: 'Registro con exito ✔',
          subHeader: `¿Deseas iniciar sesion? `,
          cssClass: 'alert-success',
          buttons: [
            {
              text: 'cancelar',
              role: 'cancel',
              handler: () => {
                this.pane.destroy({ animate: true })
              }
            },
            {
              text: 'ingresar',
              role: 'success',
              handler: () => {
                const { mail, password } = this.formRegister['value']                
                this.conectionsService.signIn({email:mail,pass:password}).subscribe()
              }
            }
          ]
        })
        this.loading = false
      }, (error) => {
        console.error(error);
        this.loading = false
      })
  }

}

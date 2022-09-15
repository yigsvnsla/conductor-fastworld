import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-encomienda',
  templateUrl: './encomienda.component.html',
  styleUrls: ['./encomienda.component.scss'],
})
export class EncomiendaComponent implements OnInit {

  public packagesList : any[]

  constructor() { }

  ngOnInit() {}

  public selectPackage(item,i){
    
  }

}

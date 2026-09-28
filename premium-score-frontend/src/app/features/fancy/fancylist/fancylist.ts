import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../services/api';

@Component({
  selector: 'app-fancylist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fancylist.html',
  styleUrl: './fancylist.scss',
})
export class Fancylist implements OnInit {
  eventId: any;
  constructor(private route: ActivatedRoute, private api:Api) {}
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.eventId = params['eventId'];

      if(this.eventId){
        this.getFancyList()
      }
    });
  }

  matchName = '';

  fancyList:any[] = [];

  rollback(item: any) {
    console.log('Rollback:', item);
  }


    getFancyList(): void {
    this.api.getFancyListByEventId(this.eventId).subscribe({
      next:(res:any)=>{
       this.fancyList=res?.data
       
      },

      error:(err:any)=>{

      }
    })
  }
}

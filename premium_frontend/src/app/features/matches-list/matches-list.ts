import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';


@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css',
})
export class MatchesList {

  selectedSport = 'Cricket';

  matches = [
    {
      mktId: '1.262066825\n36038691',
      eventName: 'Nepal v Hong Kong',
      scoreId: '0',
      openDate: '09/08/2026 07:00 AM'
    },
    {
      mktId: '1.262066828\n36038694',
      eventName: 'United Arab Emirates v Oman',
      scoreId: '0',
      openDate: '09/08/2026 07:00 AM'
    },
    {
      mktId: '-11201642\n-11201596',
      eventName: 'Chennai Super Kings SRL T20 v Sunrisers Hyderabad SRL T20',
      scoreId: '74113858',
      openDate: '09/08/2026 09:30 AM'
    },
    {
      mktId: '-11201617\n-11201571',
      eventName: 'Adelaide Strikers SRL T20 v Melbourne Stars SRL T20',
      scoreId: '74113686',
      openDate: '09/08/2026 10:30 AM'
    },
    {
      mktId: '-11201658\n-11201612',
      eventName: 'West Indies SRL T20 v Pakistan SRL T20',
      scoreId: '74114630',
      openDate: '09/08/2026 11:30 AM'
    },
    {
      mktId: '-11201651\n-11201605',
      eventName: 'Pretoria Capitals SRL T20 v Joburg Super Kings SRL T20',
      scoreId: '74114304',
      openDate: '09/08/2026 12:30 PM'
    },
    {
      mktId: '1.262122497\n36043141',
      eventName: 'Amritsar Soormas v Mohali Kings',
      scoreId: '0',
      openDate: '09/08/2026 01:00 PM'
    }
  ];

  selectSport(sport: string): void {
    this.selectedSport = sport;
  }

  search(): void {
    console.log('Search clicked');
  }

  checkScore(match: any): void {
    console.log('Check score:', match);
  }

  ourFancy(match: any): void {
    console.log('Our Fancy:', match);
  }

  allFancy(match: any): void {
    console.log('All Fancy:', match);
  }

}

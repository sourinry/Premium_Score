import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-matches-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './new-matches-list.html',
  styleUrl: './new-matches-list.css'
})
export class NewMatchesList {

  selectedSport = 'Cricket';

  matches = [
    {
      id: 1,
      mktId: ['1.262091392', '36039844'],
      eventName: 'Namibia v South Africa',
      competition: 'One Day Matches',
      date: '09/09/2026 01:00:00 PM',
      scoreId: '73712500',
      homeTeam: 'Namibia',
      awayTeam: 'South Africa',
      resultBlocked: false
    },

    {
      id: 2,
      mktId: ['1.262122410', '36043082'],
      eventName: 'Essex W v Yorkshire W',
      competition: 'Metro Bank Womens One Day Cup',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '68579602',
      homeTeam: 'Essex',
      awayTeam: 'Yorkshire',
      resultBlocked: false
    },

    {
      id: 3,
      mktId: ['-11203045', '-11202999'],
      eventName: 'England U19 v Pakistan U19',
      competition: 'One Day Internationals U19',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '0',
      homeTeam: null,
      awayTeam: null,
      resultBlocked: true
    },
    {
      id: 4,
      mktId: ['1.262091392', '36039844'],
      eventName: 'Namibia v South Africa',
      competition: 'One Day Matches',
      date: '09/09/2026 01:00:00 PM',
      scoreId: '73712500',
      homeTeam: 'Namibia',
      awayTeam: 'South Africa',
      resultBlocked: false
    },

    {
      id: 5,
      mktId: ['1.262122410', '36043082'],
      eventName: 'Essex W v Yorkshire W',
      competition: 'Metro Bank Womens One Day Cup',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '68579602',
      homeTeam: 'Essex',
      awayTeam: 'Yorkshire',
      resultBlocked: false
    },

    {
      id: 6,
      mktId: ['-11203045', '-11202999'],
      eventName: 'England U19 v Pakistan U19',
      competition: 'One Day Internationals U19',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '0',
      homeTeam: null,
      awayTeam: null,
      resultBlocked: true
    },
    {
      id: 7,
      mktId: ['1.262091392', '36039844'],
      eventName: 'Namibia v South Africa',
      competition: 'One Day Matches',
      date: '09/09/2026 01:00:00 PM',
      scoreId: '73712500',
      homeTeam: 'Namibia',
      awayTeam: 'South Africa',
      resultBlocked: false
    },

    {
      id: 8,
      mktId: ['1.262122410', '36043082'],
      eventName: 'Essex W v Yorkshire W',
      competition: 'Metro Bank Womens One Day Cup',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '68579602',
      homeTeam: 'Essex',
      awayTeam: 'Yorkshire',
      resultBlocked: false
    },

    {
      id: 9,
      mktId: ['-11203045', '-11202999'],
      eventName: 'England U19 v Pakistan U19',
      competition: 'One Day Internationals U19',
      date: '09/09/2026 03:00:00 PM',
      scoreId: '0',
      homeTeam: null,
      awayTeam: null,
      resultBlocked: true
    }
  ];

  selectSport(sport: string) {
    this.selectedSport = sport;
  }

  refreshMatches() {
    console.log('Refresh match list');
  }

  checkScore(match: any) {
    console.log('Check Score', match);
  }

  updateTeamNames(match: any, type: string) {
    console.log('Update Team Names', type, match);
  }

  toggleResult(match: any) {
    match.resultBlocked = !match.resultBlocked;
  }

  ourFancy(match: any) {
    console.log('Our Fancy', match);
  }

  allFancy(match: any) {
    console.log('All Fancy', match);
  }
}
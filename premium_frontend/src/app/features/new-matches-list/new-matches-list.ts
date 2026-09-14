import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

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
export class NewMatchesList implements OnInit {

  // ==========================================
  // SPORT
  // ==========================================

  selectedSport = 'Cricket';

  sportsValue = '';


  // ==========================================
  // LOADING
  // ==========================================

  isLoading = false;


  // ==========================================
  // MATCH DATA
  // ==========================================

  matches: any[] = [];


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private apiService: Api,
    @Inject(ToastrService)
    private toastr: ToastrService
  ) {}


  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {
    this.loadMatches();
  }


  // ==========================================
  // LOAD MATCHES
  // ==========================================

  loadMatches(): void {

    const sportMap: { [key: string]: string } = {
      Cricket: '4',
      Soccer: '1',
      Tennis: '2'
    };

    this.sportsValue =
      sportMap[this.selectedSport];

    const payload = {
      sportId: this.sportsValue
    };

    console.log('================================');
    console.log('REQUEST:', payload);
    console.log('================================');

    this.isLoading = true;

    this.apiService
      .matchListApi(payload)
      .pipe(
        finalize(() => {

          this.isLoading = false;

          console.log(
            'LOADING FINISHED:',
            this.isLoading
          );

        })
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'FULL API RESPONSE:',
            response
          );

          // ==========================================
          // MATCH DATA
          // ==========================================

          if (Array.isArray(response?.data)) {

            this.matches = response.data;

          } else {

            this.matches = [];

          }

          console.log(
            'TABLE MATCHES:',
            this.matches
          );

          console.log(
            'MATCH COUNT:',
            this.matches.length
          );

        },


        error: (error: any) => {

          console.error(
            'MATCH API ERROR:',
            error
          );

          this.matches = [];

          this.toastr.error(
            'Failed to load matches',
            'Error'
          );

        }

      });

  }


  // ==========================================
  // SELECT SPORT
  // ==========================================

  selectSport(sport: string): void {

    this.selectedSport = sport;

    this.loadMatches();

  }


  // ==========================================
  // REFRESH
  // ==========================================

  refreshMatches(): void {

    this.loadMatches();

  }


  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  getMarketIds(match: any): string[] {

    const marketId =
      match?.mktId ??
      match?.marketId ??
      [];

    if (Array.isArray(marketId)) {

      return marketId.filter(
        (id) =>
          id !== null &&
          id !== undefined &&
          String(id).trim() !== ''
      );

    }

    return String(marketId)
      .split(/\s+/)
      .filter(
        (id) => id.trim() !== ''
      );

  }


  getCompetition(match: any): string {

    return (
      match?.competition ??
      match?.competitionName ??
      ''
    );

  }


  getMatchDate(match: any): string {

    const rawDate =
      match?.date ??
      match?.openDate;

    if (!rawDate) {
      return '';
    }

    const parsedDate =
      new Date(rawDate);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return String(rawDate);

    }

    return parsedDate.toLocaleString();

  }


  // ==========================================
  // CHECK SCORE
  // ==========================================

  checkScore(match: any): void {

    console.log(
      'Check Score:',
      match
    );

  }


  // ==========================================
  // UPDATE TEAM NAMES
  // ==========================================

  updateTeamNames(
    match: any,
    type: string
  ): void {

    console.log(
      'Update Team Names:',
      type,
      match
    );

  }


  // ==========================================
  // RESULT
  // ==========================================

  toggleResult(match: any): void {

    match.resultBlocked =
      !match.resultBlocked;

  }


  // ==========================================
  // OUR FANCY
  // ==========================================

  ourFancy(match: any): void {

    console.log(
      'Our Fancy:',
      match
    );

  }


  // ==========================================
  // ALL FANCY
  // ==========================================

  allFancy(match: any): void {

    console.log(
      'All Fancy:',
      match
    );

  }

}
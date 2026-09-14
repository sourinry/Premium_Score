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
  Math = Math;
  selectedSport = 'Cricket';

  sportsValue = '';


  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;

  pageSize = 10;

  totalItems = 0;

  totalPages = 0;


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

    this.sportsValue = sportMap[this.selectedSport];

    const payload = {
      page: this.currentPage,
      limit: this.pageSize,
      sportId: +(this.sportsValue)
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


          // ==========================================
          // PAGINATION
          // ==========================================

          /*
           * Adjust these fields according to your
           * actual API response.
           */

          this.totalItems =
            response?.total ??
            response?.pagination?.total ??
            response?.meta?.total ??
            0;


          this.totalPages =
            Math.ceil(
              this.totalItems / this.pageSize
            );


          console.log(
            'TABLE MATCHES:',
            this.matches
          );

          console.log(
            'MATCH COUNT:',
            this.matches.length
          );

          console.log(
            'TOTAL ITEMS:',
            this.totalItems
          );

          console.log(
            'TOTAL PAGES:',
            this.totalPages
          );

        },


        error: (error: any) => {

          console.error(
            'MATCH API ERROR:',
            error
          );

          this.matches = [];

          this.totalItems = 0;

          this.totalPages = 0;

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

    // Change sport
    this.selectedSport = sport;

    // Important:
    // When changing sport, go back to page 1
    this.currentPage = 1;

    // Load matches for selected sport
    this.loadMatches();

  }


  // ==========================================
  // CHANGE PAGE
  // ==========================================

  changePage(page: number): void {

    // Prevent invalid pages
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.currentPage = page;

    this.loadMatches();

  }


  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.loadMatches();

    }

  }


  // ==========================================
  // NEXT PAGE
  // ==========================================

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.loadMatches();

    }

  }


  // ==========================================
  // CHANGE PAGE SIZE
  // ==========================================

  changePageSize(): void {

    // When page size changes,
    // start again from page 1

    this.currentPage = 1;

    this.loadMatches();

  }


  // ==========================================
  // PAGE NUMBERS
  // ==========================================

  getPages(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );

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
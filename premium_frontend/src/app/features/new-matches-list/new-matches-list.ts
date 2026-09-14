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
  // PAGINATION
  // ==========================================

  currentPage = 1;

  pageSize = 25;

  totalItems = 0;

  totalPages = 0;

  pageSizeOptions = [10, 25, 50, 100];


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
    sportId: this.sportsValue
  };

  console.log('REQUEST:', payload);

  this.isLoading = true;

  this.apiService
    .matchListApi(payload)
    .pipe(
      finalize(() => {
        console.log('LOADING FALSE');

        this.isLoading = false;
      })
    )
    .subscribe({

      next: (response: any) => {

        console.log('API RESPONSE:', response);

        // =====================================
        // MATCH DATA
        // =====================================

        if (Array.isArray(response?.data)) {
          this.matches = response.data;
        } else {
          this.matches = [];
        }


        // =====================================
        // PAGINATION
        // =====================================

        this.totalItems =
          Number(response?.total ?? 0);

        this.currentPage =
          Number(
            response?.page ?? this.currentPage
          );

        this.pageSize =
          Number(
            response?.limit ?? this.pageSize
          );

        this.totalPages =
          Number(
            response?.totalPages ?? 0
          );


        console.log('MATCH COUNT:', this.matches.length);
        console.log('TOTAL:', this.totalItems);
        console.log('PAGE:', this.currentPage);
        console.log('LIMIT:', this.pageSize);
        console.log('TOTAL PAGES:', this.totalPages);

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

    this.selectedSport = sport;

    // Sport change par first page
    this.currentPage = 1;

    this.loadMatches();

  }


  // ==========================================
  // REFRESH
  // ==========================================

  refreshMatches(): void {

    this.loadMatches();

  }


  // ==========================================
  // CHANGE PAGE SIZE
  // ==========================================

  changePageSize(): void {

    console.log(
      'PAGE SIZE CHANGED:',
      this.pageSize
    );

    // Page size change hone par
    // hamesha first page par jao
    this.currentPage = 1;

    this.loadMatches();

  }


  // ==========================================
  // CHANGE PAGE
  // ==========================================

  changePage(page: number): void {

    if (page < 1) {
      return;
    }

    if (page > this.totalPages) {
      return;
    }

    if (page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    this.loadMatches();

  }


  // ==========================================
  // FIRST PAGE
  // ==========================================

  firstPage(): void {

    if (this.currentPage === 1) {
      return;
    }

    this.currentPage = 1;

    this.loadMatches();

  }


  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  previousPage(): void {

    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;

    this.loadMatches();

  }


  // ==========================================
  // NEXT PAGE
  // ==========================================

  nextPage(): void {

    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;

    this.loadMatches();

  }


  // ==========================================
  // LAST PAGE
  // ==========================================

  lastPage(): void {

    if (
      this.currentPage === this.totalPages ||
      this.totalPages === 0
    ) {
      return;
    }

    this.currentPage = this.totalPages;

    this.loadMatches();

  }


  // ==========================================
  // PAGE NUMBERS
  // ==========================================

  getPages(): number[] {

    if (this.totalPages <= 0) {
      return [];
    }

    return Array.from(
      {
        length: this.totalPages
      },
      (_, index) => index + 1
    );

  }


  // ==========================================
  // START ITEM
  // ==========================================

  getStartItem(): number {

    if (this.totalItems === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;

  }


  // ==========================================
  // END ITEM
  // ==========================================

  getEndItem(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.totalItems
    );

  }


  // ==========================================
  // SERIAL NUMBER
  // ==========================================

  getSerialNumber(index: number): number {

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + index + 1;

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

    if (
      marketId === null ||
      marketId === undefined ||
      String(marketId).trim() === ''
    ) {

      return [];

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

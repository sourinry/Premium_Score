import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  NgFor,
  NgIf
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import { Api } from '../../../services/api';


@Component({
  selector: 'app-new-matches-list',

  standalone: true,

  imports: [
    NgFor,
    NgIf,
    FormsModule
  ],

  templateUrl: './new-matches-list.html',

  styleUrl: './new-matches-list.scss',
})
export class NewMatchesList implements OnInit {

  // =====================================================
  // SPORT
  // =====================================================

  selectedSport = 'Cricket';

  sportMap: { [key: string]: number } = {
    Cricket: 4,
    Soccer: 1,
    Tennis: 2
  };


  // =====================================================
  // MATCH DATA
  // =====================================================

  matches: any[] = [];

  isLoading = false;


  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;

  pageSize = 25;

  totalItems = 0;

  totalPages = 0;

  pageSizeOptions = [10, 25, 50, 100];


  // =====================================================
  // DATE FILTER
  // =====================================================

  fromDate = '2026-09-08';

  toDate = '2026-09-09';


  constructor(
    private apiService: Api,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadMatches();
  }


  // =====================================================
  // LOAD MATCHES
  // =====================================================

  loadMatches(): void {

    const payload = {
      page: this.currentPage,
      limit: this.pageSize,
      sportId: this.sportMap[this.selectedSport]
    };

    console.log('MATCH REQUEST:', payload);

    this.isLoading = true;

    this.apiService.matchListApi(payload).subscribe({

      next: (response: any) => {

        console.log('MATCH RESPONSE:', response);

        this.matches = Array.isArray(response?.data)
          ? response.data
          : [];

        this.totalItems = Number(
          response?.total ?? 0
        );

        this.currentPage = Number(
          response?.page ?? 1
        );

        this.pageSize = Number(
          response?.limit ?? this.pageSize
        );

        this.totalPages = Number(
          response?.totalPages ?? 0
        );

        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (error: any) => {

        console.error(
          'MATCH API ERROR:',
          error
        );

        this.matches = [];

        this.totalItems = 0;

        this.totalPages = 0;

        this.isLoading = false;

        this.cdr.detectChanges();
      }

    });
  }


  // =====================================================
  // SPORT
  // =====================================================

  selectSport(sport: string): void {

    if (this.selectedSport === sport) {
      return;
    }

    this.selectedSport = sport;

    this.currentPage = 1;

    this.loadMatches();
  }


  // =====================================================
  // SEARCH
  // =====================================================

  search(): void {

    this.currentPage = 1;

    this.loadMatches();
  }


  // =====================================================
  // PAGE SIZE
  // =====================================================

  changePageSize(): void {

    this.currentPage = 1;

    this.loadMatches();
  }


  // =====================================================
  // PAGE
  // =====================================================

  changePage(page: number): void {

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


  // =====================================================
  // FIRST PAGE
  // =====================================================

  firstPage(): void {

    if (this.currentPage === 1) {
      return;
    }

    this.currentPage = 1;

    this.loadMatches();
  }


  // =====================================================
  // PREVIOUS PAGE
  // =====================================================

  previousPage(): void {

    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;

    this.loadMatches();
  }


  // =====================================================
  // NEXT PAGE
  // =====================================================

  nextPage(): void {

    if (
      this.currentPage >= this.totalPages
    ) {
      return;
    }

    this.currentPage++;

    this.loadMatches();
  }


  // =====================================================
  // LAST PAGE
  // =====================================================

  lastPage(): void {

    if (
      this.currentPage === this.totalPages
    ) {
      return;
    }

    this.currentPage = this.totalPages;

    this.loadMatches();
  }


  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  getPages(): number[] {

    if (this.totalPages <= 0) {
      return [];
    }

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }


  // =====================================================
  // START ITEM
  // =====================================================

  getStartItem(): number {

    if (this.totalItems === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }


  // =====================================================
  // END ITEM
  // =====================================================

  getEndItem(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.totalItems
    );
  }


  // =====================================================
  // SERIAL NUMBER
  // =====================================================

  getSerialNumber(index: number): number {

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + index + 1;
  }


  // =====================================================
  // MARKET ID
  // =====================================================

  getMarketIds(match: any): string[] {

    if (!match?.marketId) {
      return [];
    }

    return String(match.marketId)
      .split('\n');
  }


  // =====================================================
  // OPEN DATE
  // =====================================================

  getMatchDate(date: string): string {

    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );
  }


  // =====================================================
  // CHECK SCORE
  // =====================================================

  checkScore(match: any): void {

    console.log(
      'Check Score:',
      match
    );
  }


  // =====================================================
  // OUR FANCY
  // =====================================================

  ourFancy(match: any): void {

    console.log(
      'Our Fancy:',
      match
    );
  }


  // =====================================================
  // ALL FANCY
  // =====================================================

  allFancy(match: any): void {

    console.log(
      'All Fancy:',
      match
    );
  }


  // =====================================================
  // TRACK BY
  // =====================================================

  trackByEventId(
    index: number,
    match: any
  ): string {

    return match.eventId;
  }

}

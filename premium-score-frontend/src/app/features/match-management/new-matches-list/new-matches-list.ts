import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Api } from '../../../services/api';

@Component({
  selector: 'app-new-matches-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-matches-list.html',
  styleUrl: './new-matches-list.scss',
})
export class NewMatchesList implements OnInit {
  // =====================================================
  // SPORT
  // =====================================================

  Math = Math;

  selectedSport = 'Cricket';

  sportsValue = '';

  sportMap: { [key: string]: string } = {
    Cricket: '4',
    Soccer: '1',
    Tennis: '2',
  };

  // =====================================================
  // MATCH DATA
  // =====================================================

  matches: any[] = [];

  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;

  pageSize = 10;

  totalItems = 0;

  totalPages = 0;

  pageSizeOptions = [10, 20, 50, 100];

  // =====================================================
  // LOADING
  // =====================================================

  isLoading = false;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(private apiService: Api) {}

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
    this.sportsValue = this.sportMap[this.selectedSport];

    const payload = {
      page: this.currentPage,
      limit: this.pageSize,
      sportId: Number(this.sportsValue),
    };

    console.log('================================');
    console.log('MATCH REQUEST:', payload);
    console.log('================================');

    this.isLoading = true;

    this.apiService
      .matchListApi(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          console.log('MATCH RESPONSE:', response);

          // =================================================
          // MATCH DATA
          // =================================================

          this.matches = Array.isArray(response?.data) ? response.data : [];

          // =================================================
          // TOTAL ITEMS
          // =================================================

          this.totalItems = Number(
            response?.total ?? response?.pagination?.total ?? response?.meta?.total ?? 0,
          );

          // =================================================
          // CURRENT PAGE
          // =================================================

          this.currentPage = Number(
            response?.page ?? response?.pagination?.page ?? this.currentPage,
          );

          // =================================================
          // PAGE SIZE
          // =================================================

          this.pageSize = Number(response?.limit ?? response?.pagination?.limit ?? this.pageSize);

          // =================================================
          // TOTAL PAGES
          // =================================================

          this.totalPages = Number(
            response?.totalPages ??
              response?.pagination?.totalPages ??
              Math.ceil(this.totalItems / this.pageSize),
          );

          console.log('MATCHES:', this.matches);
          console.log('TOTAL ITEMS:', this.totalItems);
          console.log('TOTAL PAGES:', this.totalPages);
        },

        error: (error: any) => {
          console.error('MATCH API ERROR:', error);

          this.matches = [];

          this.totalItems = 0;

          this.totalPages = 0;
        },
      });
  }

  // =====================================================
  // SELECT SPORT
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
  // REFRESH
  // =====================================================

  refreshMatches(): void {
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
  // CHANGE PAGE
  // =====================================================

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
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
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;

    this.loadMatches();
  }

  // =====================================================
  // LAST PAGE
  // =====================================================

  lastPage(): void {
    if (this.totalPages <= 0 || this.currentPage === this.totalPages) {
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

    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  // =====================================================
  // START ITEM
  // =====================================================

  getStartItem(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  // =====================================================
  // END ITEM
  // =====================================================

  getEndItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // =====================================================
  // SERIAL NUMBER
  // =====================================================

  getSerialNumber(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  // =====================================================
  // MARKET IDS
  // =====================================================

  getMarketIds(match: any): string[] {
    const marketId = match?.mktId ?? match?.marketId ?? [];

    if (Array.isArray(marketId)) {
      return marketId.filter((id) => id !== null && id !== undefined && String(id).trim() !== '');
    }

    return String(marketId)
      .split(/\s+/)
      .filter((id) => id.trim() !== '');
  }

  // =====================================================
  // COMPETITION
  // =====================================================

  getCompetition(match: any): string {
    return match?.competition ?? match?.competitionName ?? '';
  }

  // =====================================================
  // MATCH DATE
  // =====================================================

  getMatchDate(match: any): string {
    const rawDate = match?.date ?? match?.openDate;

    if (!rawDate) {
      return '—';
    }

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(rawDate);
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // =====================================================
  // CHECK SCORE
  // =====================================================

  checkScore(match: any): void {
    console.log('Check Score:', match);
  }

  // =====================================================
  // UPDATE TEAM NAMES
  // =====================================================

  updateTeamNames(match: any, type: string): void {
    console.log('Update Team Names:', type, match);
  }

  // =====================================================
  // RESULT
  // =====================================================

  toggleResult(match: any): void {
    match.resultBlocked = !match.resultBlocked;
  }

  // =====================================================
  // OUR FANCY
  // =====================================================

  ourFancy(match: any): void {
    console.log('Our Fancy:', match);
  }

  // =====================================================
  // ALL FANCY
  // =====================================================

  allFancy(match: any): void {
    console.log('All Fancy:', match);
  }

  // =====================================================
  // TRACK BY
  // =====================================================

  trackByEventId(index: number, match: any): string {
    return String(match?.eventId ?? index);
  }
}

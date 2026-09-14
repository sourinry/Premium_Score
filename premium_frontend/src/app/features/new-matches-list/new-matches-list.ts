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

  // ================= SPORT =================

  selectedSport = 'Cricket';


  // ================= PAGINATION =================

  currentPage = 1;

  pageSize = 5;

  totalPages = 0;

  pages: number[] = [];


  // ================= LOADING =================

  isLoading = false;


  // ================= MATCH DATA =================

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


  // ================= CONSTRUCTOR =================

  constructor() {

    this.updatePagination();

  }


  // ================= PAGINATED DATA =================

  get paginatedMatches() {

    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.matches.slice(
      startIndex,
      endIndex
    );

  }


  // ================= UPDATE PAGINATION =================

  updatePagination() {

    this.totalPages = Math.ceil(
      this.matches.length / this.pageSize
    );

    this.pages = Array.from(
      {
        length: this.totalPages
      },
      (_, index) => index + 1
    );

  }


  // ================= GO TO PAGE =================

  goToPage(page: number) {

    if (
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }

    this.currentPage = page;

  }


  // ================= NEXT PAGE =================

  nextPage() {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

    }

  }


  // ================= PREVIOUS PAGE =================

  previousPage() {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

    }

  }


  // ================= CHANGE PAGE SIZE =================

  changePageSize(size: number) {

    this.pageSize = size;

    // Always start from first page
    this.currentPage = 1;

    this.updatePagination();

  }


  // ================= SERIAL NUMBER =================

  getSerialNumber(index: number): number {

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + index + 1;

  }


  // ================= START ITEM =================

  getStartItem(): number {

    if (this.matches.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;

  }


  // ================= END ITEM =================

  getEndItem(): number {

    return Math.min(
      this.currentPage *
      this.pageSize,
      this.matches.length
    );

  }


  // ================= SPORT =================

  selectSport(sport: string) {

    this.selectedSport = sport;

    // Reset pagination
    this.currentPage = 1;

  }


  // ================= REFRESH =================

  refreshMatches() {

    console.log(
      'Refresh match list'
    );

    /*
      Later:

      this.loadMatchesFromAPI();
    */

  }


  // ================= CHECK SCORE =================

  checkScore(match: any) {

    console.log(
      'Check Score',
      match
    );

  }


  // ================= UPDATE TEAM NAMES =================

  updateTeamNames(
    match: any,
    type: string
  ) {

    console.log(
      'Update Team Names',
      type,
      match
    );

  }


  // ================= TOGGLE RESULT =================

  toggleResult(match: any) {

    match.resultBlocked =
      !match.resultBlocked;

  }


  // ================= OUR FANCY =================

  ourFancy(match: any) {

    console.log(
      'Our Fancy',
      match
    );

  }


  // ================= ALL FANCY =================

  allFancy(match: any) {

    console.log(
      'All Fancy',
      match
    );

  }

}
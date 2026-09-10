import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';

type WebsiteFilter =
  | 'all'
  | 'premium'
  | 'showResult'
  | 'unregistered';

@Component({
  selector: 'app-domain-whitelisting',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './domain-whitelisting.html',
  styleUrl: './domain-whitelisting.css',
})
export class DomainWhitelisting implements OnInit {

  constructor(private api: Api) {}

  // ==========================================
  // WEBSITE DATA
  // ==========================================

  websites: any[] = [];

  filteredWebsites: any[] = [];


  // ==========================================
  // CURRENT FILTER
  // ==========================================

  selectedFilter: WebsiteFilter = 'all';


  // ==========================================
  // POPUP
  // ==========================================

  showPopup = false;

  isPremium = false;

  isShowResult = false;


  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    this.loadWebsites();

  }


  // ==========================================
  // GET ALL WEBSITES
  // ==========================================

  loadWebsites(): void {

    this.api.getWebsites('all').subscribe({

      next: (response: any) => {

        this.websites = response?.data ?? [];

        // Initially show all
        this.applyFilter('all');

      },

      error: (error) => {

        console.error(
          'Error loading websites:',
          error
        );

        this.websites = [];

        this.filteredWebsites = [];

      }

    });

  }


  // ==========================================
  // FILTER BUTTON
  // ==========================================

 filterWebsites(filter: WebsiteFilter): void {

  this.selectedFilter = filter;

  if (filter === 'unregistered') {

    this.api.getUnregisteredWebsites().subscribe({

      next: (response: any) => {

        console.log(
          'Unregistered Websites:',
          response?.data
        );

        this.filteredWebsites = response?.data ?? [];

      },

      error: (error) => {

        console.error(
          'Error loading unregistered websites:',
          error
        );

        this.filteredWebsites = [];

      }

    });

    return;
  }

  // Baaki filters ka existing logic same
  this.applyFilter(filter);

}


  // ==========================================
  // APPLY FILTER
  // ==========================================

  private applyFilter(filter: WebsiteFilter): void {
    // ------------------------------------------
    // ALL
    // ------------------------------------------

    if (filter === 'all') {

      this.filteredWebsites = [...this.websites];
      return;
    }


    // ------------------------------------------
    // PREMIUM
    // ------------------------------------------

    if (filter === 'premium') {

      this.filteredWebsites = this.websites.filter(
        website =>
          Array.isArray(website.type) &&
          website.type.includes('premium')
      );

      return;
    }


    // ------------------------------------------
    // SHOW RESULT
    // ------------------------------------------

    if (filter === 'showResult') {

      this.filteredWebsites = this.websites.filter(
        website =>
          Array.isArray(website.type) &&
          website.type.includes('showResult')
      );

      console.log('Filtered Show Result Websites:', this.filteredWebsites);

      return;
    }


    // ------------------------------------------
    // UNREGISTERED
    // ------------------------------------------

    if (filter === 'unregistered') {

      this.filteredWebsites = this.websites.filter(
        website =>
          website.isRegistered === false &&
          website.isDeleted === true
      );


      return;
    }

  }


  // ==========================================
  // PREMIUM COUNT
  // ==========================================

  getPremiumWebsiteCount(): number {

    return this.websites.filter(
      website =>
        Array.isArray(website.type) &&
        website.type.includes('premium')
    ).length;

  }


  // ==========================================
  // ACTIVE COUNT
  // ==========================================

  getActiveWebsiteCount(): number {

    return this.websites.filter(
      website =>
        website.isRegistered === true &&
        website.isDeleted === false
    ).length;

  }


  // ==========================================
  // POPUP
  // ==========================================

  openAddPopup(): void {

    this.showPopup = true;

  }


  closePopup(): void {

    this.showPopup = false;

    this.isPremium = false;

    this.isShowResult = false;

  }


  // ==========================================
  // ADD WEBSITE
  // ==========================================

  addWebsite(): void {

    this.closePopup();

    // Reload data after adding
    this.loadWebsites();

  }


  // ==========================================
  // EDIT WEBSITE
  // ==========================================

  editWebsite(website: any): void {

    console.log('Edit:', website);

  }


  // ==========================================
  // UNREGISTER WEBSITE
  // ==========================================

  unregisterWebsite(website: any): void {

  if (!website?._id) {
    console.error('Website ID not found');
    return;
  }

  console.log(
    'Unregistering website:',
    website._id
  );

  this.api.unregisterWebsite(website._id).subscribe({

    next: (response: any) => {

      console.log(
        'Unregister response:',
        response
      );

      // API ke baad latest data reload
      this.loadWebsites();

    },

    error: (error) => {

      console.error(
        'Error unregistering website:',
        error
      );

    }

  });
}

}

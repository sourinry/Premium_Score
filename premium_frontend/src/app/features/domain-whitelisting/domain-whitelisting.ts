import { Component } from '@angular/core';
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
export class DomainWhitelisting {

  constructor(private api: Api) {}

  // =============================
  // COMPONENT INITIALIZATION
  // =============================

  ngOnInit() {
    this.showListing('all');
  }


  // =============================
  // POPUP VARIABLES
  // =============================

  showPopup = false;

  isPremium = false;

  isShowResult = false;


  // =============================
  // WEBSITE DATA
  // =============================

  websites: any[] = [];

  filteredWebsites: any[] = [];


  // =============================
  // CURRENT FILTER
  // =============================

  selectedFilter: WebsiteFilter = 'all';


  // =============================
  // OPEN ADD POPUP
  // =============================

  openAddPopup() {
    this.showPopup = true;
  }


  // =============================
  // CLOSE ADD POPUP
  // =============================

  closePopup() {
    this.showPopup = false;

    this.isPremium = false;
    this.isShowResult = false;
  }


  // =============================
  // ADD WEBSITE
  // =============================

  addWebsite() {
    console.log('Website added');

    this.closePopup();
  }


  // =============================
  // EDIT WEBSITE
  // =============================

  editWebsite(website: any) {
    console.log('Edit:', website);
  }


  // =============================
  // UNREGISTER WEBSITE
  // =============================

  unregisterWebsite(website: any) {
    console.log('Unregister:', website);
  }


  // =============================
  // GET WEBSITE LIST
  // =============================

  showListing(type: WebsiteFilter) {

    console.log('Fetching websites for:', type);

    this.api.getWebsites(type).subscribe({

      next: (response: any) => {

        console.log('Website response:', response);

        this.websites = response.data || [];

        console.log('Websites:', this.websites);

        // API already returned filtered data
        this.filteredWebsites = this.websites;

      },

      error: (error) => {

        console.error('Error fetching websites:', error);

        this.websites = [];
        this.filteredWebsites = [];

      }

    });
  }


  // =============================
  // FILTER WEBSITES
  // =============================

  filterWebsites(filter: WebsiteFilter) {

    // Update active button
    this.selectedFilter = filter;

    // Call backend with selected filter
    this.showListing(filter);
  }


  // =============================
  // PREMIUM COUNT
  // =============================

  getPremiumWebsiteCount(): number {

    return this.websites.filter(
      website => website.type === 'Premium'
    ).length;

  }


  // =============================
  // ACTIVE COUNT
  // =============================

  getActiveWebsiteCount(): number {

    return this.websites.filter(
      website => website.status === 'Active'
    ).length;

  }

}
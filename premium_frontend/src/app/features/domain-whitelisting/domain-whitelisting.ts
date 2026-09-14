import { Component, inject, OnInit } from '@angular/core';
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

  private api = inject(Api);

  // Data
  websites: any[] = [];
  unregisteredWebsites: any[] = [];
  filteredWebsites: any[] = [];

  // Filter & search
  selectedFilter: WebsiteFilter = 'all';
  searchTerm = '';

  // Loading state
  processingWebsiteIds = new Set<string>();

  // Count
  unRegistredCount = 0;

  // Popup
  showPopup = false;
  isPremium = false;
  isShowResult = false;

  ngOnInit(): void {
    this.loadWebsites();
  }

  // ==========================================
  // LOAD REGISTERED WEBSITES
  // ==========================================

  loadWebsites(): void {
    this.api.getWebsites('all').subscribe({
      next: (response: any) => {
        this.websites = Array.isArray(response?.data)
          ? response.data
          : [];

        if (this.selectedFilter !== 'unregistered') {
          this.updateDisplayedWebsites();
        }
      },

      error: (error) => {
        console.error('Error loading websites:', error);

        this.websites = [];

        if (this.selectedFilter !== 'unregistered') {
          this.filteredWebsites = [];
        }
      }
    });
  }

  // ==========================================
  // LOAD UNREGISTERED WEBSITES
  // ==========================================

  loadUnregisteredWebsites(): void {
    this.api.getUnregisteredWebsites().subscribe({
      next: (response: any) => {

        // Ignore response if user changed tab
        if (this.selectedFilter !== 'unregistered') {
          return;
        }

        this.unRegistredCount = response?.count ?? 0;

        this.unregisteredWebsites =
          Array.isArray(response?.data)
            ? response.data
            : [];

        this.updateDisplayedWebsites();
      },

      error: (error) => {
        console.error(
          'Error loading unregistered websites:',
          error
        );

        this.unregisteredWebsites = [];
        this.filteredWebsites = [];
        this.unRegistredCount = 0;
      }
    });
  }

  // ==========================================
  // FILTER
  // ==========================================

  filterWebsites(filter: WebsiteFilter): void {
    this.selectedFilter = filter;
    this.filteredWebsites = [];

    if (filter === 'unregistered') {
      this.loadUnregisteredWebsites();
      return;
    }

    this.updateDisplayedWebsites();
  }

  // ==========================================
  // UPDATE DISPLAYED DATA
  // ==========================================

  private updateDisplayedWebsites(): void {
    let data: any[] = [];

    switch (this.selectedFilter) {

      case 'all':
        data = [...this.websites];
        break;

      case 'premium':
        data = this.websites.filter(
          website =>
            Array.isArray(website.type) &&
            website.type.includes('premium')
        );
        break;

      case 'showResult':
        data = this.websites.filter(
          website =>
            Array.isArray(website.type) &&
            website.type.includes('showResult')
        );
        break;

      case 'unregistered':
        data = [...this.unregisteredWebsites];
        break;
    }

    this.filteredWebsites = this.filterBySearch(data);
  }

  // ==========================================
  // SEARCH
  // ==========================================

  private filterBySearch(data: any[]): any[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return data;
    }

    return data.filter(website => {
      const websiteName =
        website.websiteName?.toString().toLowerCase() ?? '';

      const domainUrl =
        website.domainUrl?.toString().toLowerCase() ?? '';

      return (
        websiteName.includes(search) ||
        domainUrl.includes(search)
      );
    });
  }

  onSearch(): void {
    this.updateDisplayedWebsites();
  }

  // ==========================================
  // COUNTS
  // ==========================================

  getPremiumWebsiteCount(): number {
    return this.websites.filter(
      website =>
        Array.isArray(website.type) &&
        website.type.includes('premium')
    ).length;
  }

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
    this.loadWebsites();
  }

  // ==========================================
  // EDIT WEBSITE
  // ==========================================

  editWebsite(website: any): void {
    console.log('Edit website:', website);
  }

  // ==========================================
  // UNREGISTER WEBSITE
  // ==========================================

  unregisterWebsite(website: any): void {
    const websiteId = website?._id;

    if (!websiteId) {
      console.error('Website ID not found');
      return;
    }

    if (this.processingWebsiteIds.has(websiteId)) {
      return;
    }

    this.processingWebsiteIds.add(websiteId);

    this.api.unregisterWebsite(websiteId).subscribe({
      next: () => {
        this.loadWebsites();
      },

      error: (error) => {
        console.error(
          'Error unregistering website:',
          error
        );
      },

      complete: () => {
        this.processingWebsiteIds.delete(websiteId);
      }
    });
  }

  // ==========================================
  // REGISTER WEBSITE
  // ==========================================

  registerWebsite(id: string): void {
    if (!id) {
      console.error('Website ID not found');
      return;
    }

    if (this.processingWebsiteIds.has(id)) {
      return;
    }

    this.processingWebsiteIds.add(id);

    this.api.registerWebsite(id).subscribe({
      next: () => {
        // We are on Unregistered tab,
        // so reload Unregistered data.
        if (this.selectedFilter === 'unregistered') {
          this.loadUnregisteredWebsites();
        } else {
          this.loadWebsites();
        }
      },

      error: (error) => {
        console.error(
          'Error registering website:',
          error
        );
      },

      complete: () => {
        this.processingWebsiteIds.delete(id);
      }
    });
  }
}
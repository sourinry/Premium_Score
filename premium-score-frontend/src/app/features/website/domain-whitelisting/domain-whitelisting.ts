
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './domain-whitelisting.html',
  styleUrl: './domain-whitelisting.scss',
})
export class DomainWhitelisting implements OnInit {
  websiteName = '';
  domainUrl = '';

  premiumEndpoint = 'setPremFancyResultThreadCommon';
  premiumRollbackEndpoint = 'rollbackCommonPremFancyResult';

  showResultEndpoint = 'showResult';
  showResultRollbackEndpoint = 'rollbackShowResult';

  isAutoResult = false;

  isPremium = false;
  isShowResult = false;

  isEditMode = false;
  editingWebsiteId: string | null = null;

  websites: any[] = [];
  filteredWebsites: any[] = [];

  // Stores the data received from /websites/unregistered
  unregisteredWebsites: any[] = [];

  searchText = '';

  selectedFilter: WebsiteFilter = 'all';

  showPopup = false;

  isLoading = false;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadWebsites();
  }

  // --------------------------------------------------
  // LOAD ALL WEBSITES
  // --------------------------------------------------

  loadWebsites(): void {
    this.isLoading = true;

    this.api.getWebsites('all').subscribe({
      next: (response: any) => {
        console.log('WEBSITES RESPONSE:', response);

        this.websites = Array.isArray(response?.data)
          ? response.data
          : [];

        this.applyFilter(this.selectedFilter);

        this.isLoading = false;
      },

      error: (error: any) => {
        console.error('Error loading websites:', error);

        this.websites = [];
        this.filteredWebsites = [];

        this.isLoading = false;
      },
    });
  }

  // --------------------------------------------------
  // LOAD UNREGISTERED WEBSITES
  // --------------------------------------------------

  loadUnregisteredWebsites(): void {
    this.isLoading = true;

    this.api.getUnregisteredWebsites().subscribe({
      next: (response: any) => {
        console.log('UNREGISTERED WEBSITES RESPONSE:', response);

        this.unregisteredWebsites = Array.isArray(response?.data)
          ? response.data
          : [];

        this.applySearchToUnregistered();

        this.isLoading = false;
      },

      error: (error: any) => {
        console.error(
          'Error loading unregistered websites:',
          error,
        );

        this.unregisteredWebsites = [];
        this.filteredWebsites = [];

        this.isLoading = false;
      },
    });
  }

  // --------------------------------------------------
  // FILTER WEBSITES
  // --------------------------------------------------

  filterWebsites(filter: WebsiteFilter): void {
    this.selectedFilter = filter;
    this.searchText = '';

    // Unregistered websites come from a separate API
    if (filter === 'unregistered') {
      this.loadUnregisteredWebsites();
      return;
    }

    this.applyFilter(filter);
  }

  // --------------------------------------------------
  // APPLY NORMAL FILTERS
  // --------------------------------------------------

  private applyFilter(filter: WebsiteFilter): void {
    let result: any[] = [];

    if (filter === 'all') {
      result = [...this.websites];
    }

    if (filter === 'premium') {
      result = this.websites.filter(
        (website) =>
          Array.isArray(website?.type) &&
          website.type.includes('premium'),
      );
    }

    if (filter === 'showResult') {
      result = this.websites.filter(
        (website) =>
          Array.isArray(website?.type) &&
          website.type.includes('showResult'),
      );
    }

    const search = this.searchText.trim().toLowerCase();

    if (search) {
      result = result.filter((website) => {
        const websiteName = String(
          website?.websiteName ?? '',
        ).toLowerCase();

        const domainUrl = String(
          website?.domainUrl ?? '',
        ).toLowerCase();

        return (
          websiteName.includes(search) ||
          domainUrl.includes(search)
        );
      });
    }

    this.filteredWebsites = result;
  }

  // --------------------------------------------------
  // SEARCH UNREGISTERED WEBSITES
  // --------------------------------------------------

  private applySearchToUnregistered(): void {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      this.filteredWebsites = [
        ...this.unregisteredWebsites,
      ];

      return;
    }

    this.filteredWebsites = this.unregisteredWebsites.filter(
      (website) => {
        const websiteName = String(
          website?.websiteName ?? '',
        ).toLowerCase();

        const domainUrl = String(
          website?.domainUrl ?? '',
        ).toLowerCase();

        return (
          websiteName.includes(search) ||
          domainUrl.includes(search)
        );
      },
    );
  }

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  searchWebsites(): void {
    if (this.selectedFilter === 'unregistered') {
      this.applySearchToUnregistered();
      return;
    }

    this.applyFilter(this.selectedFilter);
  }

  // --------------------------------------------------
  // WEBSITE COUNTS
  // --------------------------------------------------

  getPremiumWebsiteCount(): number {
    return this.websites.filter(
      (website) =>
        Array.isArray(website?.type) &&
        website.type.includes('premium'),
    ).length;
  }

  getActiveWebsiteCount(): number {
    return this.websites.filter(
      (website) => website?.isRegistered === true,
    ).length;
  }

  // --------------------------------------------------
  // ADD WEBSITE
  // --------------------------------------------------

  openAddPopup(): void {
    this.isEditMode = false;
    this.editingWebsiteId = null;

    this.resetForm();

    this.showPopup = true;
  }

  // --------------------------------------------------
  // EDIT WEBSITE
  // --------------------------------------------------

  editWebsite(website: any): void {
    if (!website?._id) {
      console.error('Website ID not found');
      return;
    }

    this.isEditMode = true;
    this.editingWebsiteId = website._id;

    this.websiteName = website.websiteName ?? '';

    this.domainUrl = website.domainUrl ?? '';

    this.isPremium =
      website?.premium?.enabled === true ||
      website?.type?.includes('premium');

    this.premiumEndpoint =
      website?.premium?.endpoint ?? '';

    this.premiumRollbackEndpoint =
      website?.premium?.rollbackEndpoint ?? '';

    this.isShowResult =
      website?.showResult?.enabled === true ||
      website?.type?.includes('showResult');

    this.showResultEndpoint =
      website?.showResult?.endpoint ?? '';

    this.showResultRollbackEndpoint =
      website?.showResult?.rollbackEndpoint ?? '';

    this.isAutoResult =
      website?.isAutoResult === true;

    this.showPopup = true;
  }

  // --------------------------------------------------
  // CLOSE POPUP
  // --------------------------------------------------

  closePopup(): void {
    this.showPopup = false;
    this.resetForm();
  }

  // --------------------------------------------------
  // ADD / UPDATE WEBSITE
  // --------------------------------------------------

  addWebsite(): void {
    if (!this.websiteName.trim()) {
      console.warn('Website name is required');
      return;
    }

    if (!this.domainUrl.trim()) {
      console.warn('Domain URL is required');
      return;
    }

    const type: string[] = [];

    if (this.isPremium) {
      type.push('premium');
    }

    if (this.isShowResult) {
      type.push('showResult');
    }

    const payload = {
      websiteName: this.websiteName.trim(),

      domainUrl: this.domainUrl.trim(),

      type,

      premium: {
        enabled: this.isPremium,

        endpoint: this.isPremium
          ? this.premiumEndpoint.trim()
          : '',

        rollbackEndpoint: this.isPremium
          ? this.premiumRollbackEndpoint.trim()
          : '',
      },

      showResult: {
        enabled: this.isShowResult,

        endpoint: this.isShowResult
          ? this.showResultEndpoint.trim()
          : '',

        rollbackEndpoint: this.isShowResult
          ? this.showResultRollbackEndpoint.trim()
          : '',
      },

      isAutoResult: this.isAutoResult,
    };

    // UPDATE
    if (this.isEditMode && this.editingWebsiteId) {
      this.api
        .updateWebsite(
          this.editingWebsiteId,
          payload,
        )
        .subscribe({
          next: (response: any) => {
            console.log(
              'WEBSITE UPDATED:',
              response,
            );

            this.closePopup();
            this.loadWebsites();
          },

          error: (error: any) => {
            console.error(
              'Error updating website:',
              error,
            );
          },
        });

      return;
    }

    // ADD
    this.api.addWebsite(payload).subscribe({
      next: (response: any) => {
        console.log(
          'WEBSITE ADDED:',
          response,
        );

        this.closePopup();
        this.loadWebsites();
      },

      error: (error: any) => {
        console.error(
          'Error adding website:',
          error,
        );
      },
    });
  }

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  resetForm(): void {
    this.websiteName = '';
    this.domainUrl = '';

    this.isPremium = false;
    this.isShowResult = false;

    this.premiumEndpoint =
      'setPremFancyResultThreadCommon';

    this.premiumRollbackEndpoint =
      'rollbackCommonPremFancyResult';

    this.showResultEndpoint = 'showResult';

    this.showResultRollbackEndpoint =
      'rollbackShowResult';

    this.isAutoResult = false;

    this.isEditMode = false;
    this.editingWebsiteId = null;
  }

  // --------------------------------------------------
  // UNREGISTER WEBSITE
  // --------------------------------------------------

  unregisterWebsite(website: any): void {
    if (!website?._id) {
      console.error('Website ID not found');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to unregister "${website.websiteName}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.api
      .unregisterWebsite(website._id)
      .subscribe({
        next: (response: any) => {
          console.log(
            'UNREGISTER RESPONSE:',
            response,
          );

          this.loadWebsites();
        },

        error: (error: any) => {
          console.error(
            'Error unregistering website:',
            error,
          );
        },
      });
  }

  // --------------------------------------------------
  // REGISTER WEBSITE
  // --------------------------------------------------

  registerWebsite(website: any): void {
    if (!website?._id) {
      console.error('Website ID not found');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to register "${website.websiteName}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.api
      .registerWebsite(website._id)
      .subscribe({
        next: (response: any) => {
          console.log(
            'REGISTER RESPONSE:',
            response,
          );

          this.loadWebsites();
        },

        error: (error: any) => {
          console.error(
            'Error registering website:',
            error,
          );
        },
      });
  }

  // --------------------------------------------------
  // WEBSITE STATUS
  // --------------------------------------------------

  isRegistered(website: any): boolean {
    return website?.isRegistered === true;
  }

  getWebsiteStatus(website: any): string {
    return this.isRegistered(website)
      ? 'Unregistered'
      : 'Registered';
  }

  getWebsiteStatusClass(website: any): string {
    return this.isRegistered(website)
      ? 'text-bg-danger'
      : 'text-bg-success';
  }

  // --------------------------------------------------
  // ENDPOINT
  // --------------------------------------------------

  getEndpoint(website: any): string {
    if (website?.type?.includes('premium')) {
      return website?.premium?.endpoint || '-';
    }

    if (website?.type?.includes('showResult')) {
      return (
        website?.showResult?.endpoint || '-'
      );
    }

    return '-';
  }

  // --------------------------------------------------
  // TYPE HELPERS
  // --------------------------------------------------

  hasPremium(website: any): boolean {
    return website?.type?.includes('premium');
  }

  hasShowResult(website: any): boolean {
    return website?.type?.includes('showResult');
  }
}


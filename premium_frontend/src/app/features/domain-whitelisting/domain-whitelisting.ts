import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { ToastrService } from 'ngx-toastr';

type WebsiteFilter = 'all' | 'premium' | 'showResult' | 'unregistered';

@Component({
  selector: 'app-domain-whitelisting',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './domain-whitelisting.html',
  styleUrl: './domain-whitelisting.css',
})
export class DomainWhitelisting implements OnInit {
  websiteName = '';
  domainUrl = '';

  premiumEndpoint = 'setPremFancyResultThreadCommon';
  premiumRollbackEndpoint = 'rollbackCommonPremFancyResult';

  showResultEndpoint = 'showResult';
  showResultRollbackEndpoint = 'rollbackShowResult';

  isAutoResult = false;

  // Edit mode
  isEditMode = false;
  editingWebsiteId: string | null = null;

  constructor(
    private api: Api,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

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
        console.error('Error loading websites:', error);

        this.websites = [];

        this.filteredWebsites = [];
      },
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
          console.log('Unregistered Websites:', response?.data);

          this.filteredWebsites = response?.data ?? [];
        },

        error: (error) => {
          console.error('Error loading unregistered websites:', error);

          this.filteredWebsites = [];
        },
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
        (website) => Array.isArray(website.type) && website.type.includes('premium'),
      );

      return;
    }

    // ------------------------------------------
    // SHOW RESULT
    // ------------------------------------------

    if (filter === 'showResult') {
      this.filteredWebsites = this.websites.filter(
        (website) => Array.isArray(website.type) && website.type.includes('showResult'),
      );

      console.log('Filtered Show Result Websites:', this.filteredWebsites);

      return;
    }

    // ------------------------------------------
    // UNREGISTERED
    // ------------------------------------------

    if (filter === 'unregistered') {
      this.filteredWebsites = this.websites.filter(
        (website) => website.isRegistered === false && website.isDeleted === true,
      );

      return;
    }
  }

  // ==========================================
  // PREMIUM COUNT
  // ==========================================

  getPremiumWebsiteCount(): number {
    return this.websites.filter(
      (website) => Array.isArray(website.type) && website.type.includes('premium'),
    ).length;
  }

  // ==========================================
  // ACTIVE COUNT
  // ==========================================

  getActiveWebsiteCount(): number {
    return this.websites.filter(
      (website) => website.isRegistered === true && website.isDeleted === false,
    ).length;
  }

  // ==========================================
  // POPUP
  // ==========================================

  openAddPopup(): void {
    this.isEditMode = false;
    this.editingWebsiteId = null;

    this.resetForm();

    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;

    this.resetForm();
    this.cdr.detectChanges();
  }

  // ==========================================
  // ADD WEBSITE
  // ==========================================

  editWebsite(website: any): void {
    if (!website?._id) {
      console.error('Website ID not found');
      return;
    }

    this.isEditMode = true;

    this.editingWebsiteId = website._id;

    // Website basic details
    this.websiteName = website.websiteName ?? '';

    this.domainUrl = website.domainUrl ?? '';

    // Premium
    this.isPremium = website.premium?.enabled === true || website.type?.includes('premium');

    this.premiumEndpoint = website.premium?.endpoint ?? '';

    this.premiumRollbackEndpoint = website.premium?.rollbackEndpoint ?? '';

    // Show Result
    this.isShowResult =
      website.showResult?.enabled === true || website.type?.includes('showResult');

    this.showResultEndpoint = website.showResult?.endpoint ?? '';

    this.showResultRollbackEndpoint = website.showResult?.rollbackEndpoint ?? '';
    // Auto Result
    this.isAutoResult = website.isAutoResult === true;

    this.showPopup = true;
  }

  addWebsite(): void {
    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!this.websiteName.trim()) {
      console.error('Website name is required');
      return;
    }

    if (!this.domainUrl.trim()) {
      console.error('Domain URL is required');
      return;
    }

    // -----------------------------------------
    // TYPE
    // -----------------------------------------

    const type: string[] = [];

    if (this.isPremium) {
      type.push('premium');
    }

    if (this.isShowResult) {
      type.push('showResult');
    }

    // -----------------------------------------
    // PAYLOAD
    // -----------------------------------------

    const payload = {
      websiteName: this.websiteName.trim(),

      domainUrl: this.domainUrl.trim(),

      type: type,

      premium: {
        enabled: this.isPremium,

        endpoint: this.isPremium ? this.premiumEndpoint.trim() : '',

        rollbackEndpoint: this.isPremium ? this.premiumRollbackEndpoint.trim() : '',
      },

      showResult: {
        enabled: this.isShowResult,

        endpoint: this.isShowResult ? this.showResultEndpoint.trim() : '',

        rollbackEndpoint: this.isShowResult ? this.showResultRollbackEndpoint.trim() : '',
      },

      isAutoResult: this.isAutoResult,
    };

    console.log('WEBSITE PAYLOAD:', payload);

    // =========================================
    // UPDATE
    // =========================================

    if (this.isEditMode && this.editingWebsiteId) {
      this.api.updateWebsite(this.editingWebsiteId, payload).subscribe({
        next: (response: any) => {
          console.log('Website updated successfully:', response);
          this.toastr.success('Website updated successfully', 'Success');
          this.closePopup();

          this.resetForm();

          this.loadWebsites();
        },

        error: (error) => {
          console.error('Error updating website:', error);
        },
      });

      return;
    }

    // =========================================
    // ADD
    // =========================================

    this.api.addWebsite(payload).subscribe({
      next: (response: any) => {
        console.log('Website added successfully:', response);
        this.toastr.success('Website added successfully', 'Success');
        this.closePopup();

        this.resetForm();

        this.loadWebsites();
      },

      error: (error) => {
        console.error('Error adding website:', error);
      },
    });
  }

  resetForm(): void {
    this.websiteName = '';

    this.domainUrl = '';

    this.isPremium = false;

    this.isShowResult = false;

    this.premiumEndpoint = 'setPremFancyResultThreadCommon';

    this.premiumRollbackEndpoint = 'rollbackCommonPremFancyResult';

    this.showResultEndpoint = 'showResult';

    this.showResultRollbackEndpoint = 'rollbackShowResult';

    this.isAutoResult = false;

    this.isEditMode = false;

    this.editingWebsiteId = null;
  }

  // ==========================================
  // UNREGISTER WEBSITE
  // ==========================================

  unregisterWebsite(website: any): void {
    if (!website?._id) {
      console.error('Website ID not found');
      return;
    }

    console.log('Unregistering website:', website._id);

    this.api.unregisterWebsite(website._id).subscribe({
      next: (response: any) => {
        console.log('Unregister response:', response);

        // API ke baad latest data reload
        this.loadWebsites();
      },

      error: (error) => {
        console.error('Error unregistering website:', error);
      },
    });
  }
}
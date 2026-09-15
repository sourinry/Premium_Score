import { Component, output, signal } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  // Sidebar state
  isCollapsed = signal(false);

  // Send collapsed state to parent
  sidebarToggle = output<boolean>();

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);

    this.sidebarToggle.emit(this.isCollapsed());
  }
}
import { Component, output, signal } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  isCollapsed = signal(false);

  sidebarToggle = output<boolean>();

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);

    this.sidebarToggle.emit(this.isCollapsed());
  }

}
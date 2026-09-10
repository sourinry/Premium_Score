import { Injectable } from '@angular/core';
import { enviorment } from '../environment/enviroment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Api {
  baseApiUrl = enviorment.baseApiUrl;

  constructor(private http: HttpClient) {}

  getWebsites(type: string) {
    return this.http.get(`${this.baseApiUrl}/websites`, {
      params: {
        type,
      },
    });
  }

  unregisterWebsite(websiteId: string) {
    return this.http.patch(`${this.baseApiUrl}/websites/${websiteId}/unregister`, {});
  }

  getUnregisteredWebsites() {
  return this.http.get(`${this.baseApiUrl}/websites/unregistered`);
}
}

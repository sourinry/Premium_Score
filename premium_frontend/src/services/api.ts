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

addWebsite(payload: any) {
  return this.http.post(
    `${this.baseApiUrl}/websites`,
    payload
  );
}

updateWebsite(websiteId: string, payload: any) {
  return this.http.put(
    `${this.baseApiUrl}/websites/${websiteId}`,
    payload
  );
}

matchListApi(payload: any) {
  return this.http.get(
    `${this.baseApiUrl}/matches`,
    {
      params: {
        sportId: String(payload.sportId),
        page: String(payload.page),
        limit: String(payload.limit),
       
      }
    }
  );
}
}

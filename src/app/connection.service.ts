import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  constructor(private http: HttpClient) {}
  public uploadImage(
    formData: FormData,
    headers: HttpHeaders
  ): Observable<any> {
    return this.http.post('http://localhost:8000/resize', formData, {
      headers: headers,
    });
  }
  /**
   * getlayers
   */
  public getlayers(body: Object): Observable<any> {
    return this.http.post('http://localhost:8000/getlayers', body);
  }
}

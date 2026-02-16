import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  JSA, JSO, Event, DashboardData, PaginatedResponse,
  HazardCatalogEntry, PPECatalogEntry
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getJSAs(params?: Record<string, string>): Observable<PaginatedResponse<JSA>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    }
    return this.http.get<PaginatedResponse<JSA>>(`${this.base}/jsas`, { params: httpParams });
  }

  getJSA(id: string): Observable<JSA> {
    return this.http.get<JSA>(`${this.base}/jsas/${id}`);
  }

  createJSA(data: Partial<JSA>): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas`, data);
  }

  updateJSA(id: string, data: Partial<JSA>): Observable<JSA> {
    return this.http.patch<JSA>(`${this.base}/jsas/${id}`, data);
  }

  submitJSA(id: string): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas/${id}/submit`, {});
  }

  approveJSA(id: string, comments?: string): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas/${id}/approve`, { comments });
  }

  rejectJSA(id: string, comments: string): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas/${id}/reject`, { comments });
  }

  closeJSA(id: string): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas/${id}/close`, {});
  }

  addSignature(id: string, signatureData: string): Observable<JSA> {
    return this.http.post<JSA>(`${this.base}/jsas/${id}/signature`, { signatureData });
  }

  createFlag(data: { jsaId: string; flagType: string; reason: string; severity?: string }): Observable<Event> {
    return this.http.post<Event>(`${this.base}/events/flag`, data);
  }

  createStopJob(data: { jsaId: string; reason: string; severity: string }): Observable<{ event: Event; jso: JSO }> {
    return this.http.post<{ event: Event; jso: JSO }>(`${this.base}/events/stop-job`, data);
  }

  getEvents(params?: Record<string, string>): Observable<PaginatedResponse<Event>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    }
    return this.http.get<PaginatedResponse<Event>>(`${this.base}/events`, { params: httpParams });
  }

  resolveEvent(id: string, resolutionNotes: string): Observable<Event> {
    return this.http.post<Event>(`${this.base}/events/${id}/resolve`, { resolutionNotes });
  }

  getJSOs(params?: Record<string, string>): Observable<PaginatedResponse<JSO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    }
    return this.http.get<PaginatedResponse<JSO>>(`${this.base}/jsos`, { params: httpParams });
  }

  getJSO(id: string): Observable<JSO> {
    return this.http.get<JSO>(`${this.base}/jsos/${id}`);
  }

  startJSO(id: string): Observable<JSO> {
    return this.http.post<JSO>(`${this.base}/jsos/${id}/start`, {});
  }

  completeJSO(id: string, data: {
    rootCause: string;
    correctiveActions: string;
    preventiveActions?: string;
    resolutionNotes?: string;
  }): Observable<JSO> {
    return this.http.post<JSO>(`${this.base}/jsos/${id}/complete`, data);
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/reports/dashboard`);
  }

  getStrengthTrends(period?: string): Observable<Array<{ period: string; averageScore: number; count: number }>> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    return this.http.get<Array<{ period: string; averageScore: number; count: number }>>(`${this.base}/reports/strength-trends`, { params });
  }

  exportJSAs(format: string): Observable<Blob | JSA[]> {
    if (format === 'csv') {
      return this.http.get(`${this.base}/reports/export/jsas?format=csv`, { responseType: 'blob' }) as Observable<Blob>;
    }
    return this.http.get<JSA[]>(`${this.base}/reports/export/jsas?format=json`);
  }

  uploadAttachment(file: File, entityType: string, entityId: string): Observable<{ id: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    return this.http.post<{ id: string; fileName: string }>(`${this.base}/attachments`, formData);
  }

  getHazardCatalog(): Observable<HazardCatalogEntry[]> {
    return this.http.get<HazardCatalogEntry[]>(`${this.base}/config/hazards`);
  }

  getPPECatalog(): Observable<PPECatalogEntry[]> {
    return this.http.get<PPECatalogEntry[]>(`${this.base}/config/ppe`);
  }

  getJobTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/config/job-types`);
  }

  getBusinessUnits(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/config/business-units`);
  }
}

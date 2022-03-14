import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpErrorResponse, HttpEventType } from  '@angular/common/http';
import { map } from  'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  PDFUPLOAD_URL: string = "https://members.cscstation.com:3000/offices/uploadpdf";


  constructor(private httpClient: HttpClient) { }

  public uploadPDF(formData) {

    return this.httpClient.post<any>(this.PDFUPLOAD_URL, formData, {
        reportProgress: true,
        observe: 'events'
      });
  }



}

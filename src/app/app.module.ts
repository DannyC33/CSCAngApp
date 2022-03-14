import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogComponent } from './dialog/dialog.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth-interceptor';
import { IncomingInterceptor } from './services/incoming-interceptor';

import { SignupComponent } from './signup/signup.component';

import { MatIconModule } from '@angular/material/icon';
import { NgxCurrencyModule } from 'ngx-currency';
import { MdePopoverModule } from '@material-extended/mde';
import { NgxMaskModule, IConfig } from 'ngx-mask';
import { BackButtonDisableModule } from 'angular-disable-browser-back-button';

import { ChartsModule } from 'ng2-charts';

import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';

import { AngularFileUploaderModule } from 'angular-file-uploader';
import { OrderModule } from 'ngx-order-pipe';
import {AccordionModule} from 'primeng/accordion';
import {MenuItem} from 'primeng/api';

import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

import {ToastModule} from 'primeng/toast';

import {TableModule} from 'primeng/table';
import {CalendarModule} from 'primeng/calendar';
import {SliderModule} from 'primeng/slider';
import {MultiSelectModule} from 'primeng/multiselect';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {DropdownModule} from 'primeng/dropdown';
import {ProgressBarModule} from 'primeng/progressbar';
import {InputTextModule} from 'primeng/inputtext';
import {FileUploadModule} from 'primeng/fileupload';
import {ToolbarModule} from 'primeng/toolbar';
import {RatingModule} from 'primeng/rating';
import {RadioButtonModule} from 'primeng/radiobutton';
import {InputNumberModule} from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import {CheckboxModule} from 'primeng/checkbox';
export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

const appRoutes: Routes = [

   {    path: 'home', component: HomeComponent},
  {    path: 'signup', component: SignupComponent},
  {    path: '', redirectTo: '/home', pathMatch: 'full'},
  {    path: '**', redirectTo: '/home'}

];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DialogComponent,
    SignupComponent,


    ],
  entryComponents: [DialogComponent],
  imports: [
    BrowserModule,
    ChartsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    ScrollingModule,
    HttpClientModule,
    NgxCurrencyModule,
    MdePopoverModule,
    NgxMaskModule.forRoot(),
    BackButtonDisableModule.forRoot({
      preserveScrollPosition: true
    }),
    RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule,
    AngularFileUploaderModule,
    OrderModule,
    ToastModule,
    TableModule,
    CalendarModule,
		SliderModule,
		DialogModule,
		MultiSelectModule,
		ContextMenuModule,
		DropdownModule,
		ButtonModule,
		InputTextModule,
    ProgressBarModule,
    FileUploadModule,
    ToolbarModule,
    RatingModule,
    RadioButtonModule,
    InputNumberModule,
    ConfirmDialogModule,
    InputTextareaModule,
    CheckboxModule

  ],
  exports: [
    MatIconModule,

  ],
  providers: [ {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: IncomingInterceptor, multi: true}],

  bootstrap: [AppComponent]
})
export class AppModule { }

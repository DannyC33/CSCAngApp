import { AfterViewInit, Component, HostListener, Inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { countries } from '../models/countries';
import { usStates } from '../models/us_states';
import { caStates } from '../models/ca_states';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { formatDate } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MdePopoverTrigger } from '@material-extended/mde';
import { OfficeSubscription } from '../models/officesubscriptions';
import { Pricing } from '../data/pricing';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { Router, UrlHandlingStrategy } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Agreement } from '../data/agreementText';
import { CreditCardValidators } from 'angular-cc-library';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, AfterViewInit {
  constructor(@Inject(DOCUMENT) 
              private document: Document,
              private formBuilder: FormBuilder,
              private http: HttpClient,
              public dialog: MatDialog,
              private router: Router,
              private sanitizer: DomSanitizer) {

    this._unsubscribeAll = new Subject();
  }

  // tslint:disable-next-line:typedef
  get controls() { // a getter!
    return (this.formGroup2.get('addtlMembers') as FormArray).controls;
  }

  // tslint:disable-next-line:typedef
  get officeControls() {
    return (this.formGroup3.get('offices') as FormArray).controls;
  }
  @ViewChild(MdePopoverTrigger) trigger: MdePopoverTrigger;

  formGroup1: FormGroup;
  formGroup2: FormGroup;
  formGroup3: FormGroup;
  formGroup4: FormGroup;
  formGroup5: FormGroup;
  formGroup6: FormGroup;
  creditCardToken = '';
  creditCardNumber = '';
  frameurl;
  step1 = false;
  country = countries;
  // tslint:disable-next-line:variable-name
  us_states = usStates;
  // tslint:disable-next-line:variable-name
  ca_states = caStates;
  // tslint:disable-next-line:ban-types
  additionalMembers: Object[];
  // tslint:disable-next-line:variable-name
  private _unsubscribeAll: Subject<any>;
  newMembers = new FormArray([]);
  newOpenspaces = new FormArray([]);
  newDedicated = new FormArray([]);
  newOffices = new FormArray([]);
  minDate = new Date();
  totalMembers = 1;
  assignedMembers = 0;
  addingSubscription = false;
  showOpenspace = false;
  showDedicated = false;
  showOffice = false;
  showSubscriptions = true;
  members = [];
  openspaceSubscriptions = [];
  dedicatedSubscriptions = [];
  officeSubscriptions: OfficeSubscription[] = [];
  office = [];
  nbOffices = 0;
  popupRoomNumber = '';
  popoverMessage = '';
  popupCapacity = '';
  popupFloor = '';
  popupSqft = '';
  popupDescription = '';
  popupPrice = '';
  popupAvailability = false;
  popupPhoto = '';
  confRooms; // TERRIBLE NAMING SHOULD BE OFFICES....had too many beers that night ;=)
  officeAdded = false;
  totalAdServ = 0;
  showPrice: number[] = [];
  pricing = Pricing;
  promoCode = '';
  unknownPromoCode = false;
  agreementText = Agreement.text;
  submittingForm = false;
  retainer = 0;
  emailPattern = '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,4}$';

  @HostListener('window:message', ['$event'])

  // tslint:disable-next-line:typedef
  onMessage(e) {
    if (e && e.data && e.data.token !== undefined){
      // alert(JSON.stringify(e.data.token));
      this.creditCardToken = e.data.token;
      this.creditCardNumber = e.data.ccnumber;
      if (this.creditCardToken.length > 5) {
        this.quickMember();
      }
    }


  }

  // tslint:disable-next-line:typedef
  drop(event: CdkDragDrop<string[]>, subscription: string, myOffice: number) {

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);

    }

    // Handle subscription plan type (openspace, dedicated or officespace)
    switch (subscription) {
      case 'openspace':
        this.updateSubscriptions(this.openspaceSubscriptions, this.members, 'openspace');
        break;
      case 'dedicated':
        this.updateSubscriptions(this.dedicatedSubscriptions, this.members, 'dedicated');
        break;
      case 'office':
        this.updateSubscriptions(this.officeSubscriptions[myOffice].members, this.members, 'office_' + myOffice);
        break;

    }

  }
  // ******************************************
  // BIG INIT BLOCK
  // ******************************************

  ngOnInit(): void {
    // LOAD 3RD PARTY PROVIDER IFRAME FOR CREDIT CARD TOKENIZATION
    this.frameurl = this.sanitizer.bypassSecurityTrustResourceUrl('../../assets/iframe.html');

    // API CALL TO GET CURRENTLY AVAIBALE OFFICES
    this.http.get<any>('https://csc.iocore.tv:3000/offices/list').subscribe(data => {
      this.confRooms = data.offices;

  });
    // API CALL TO GET CURRENT PRICING
    this.http.get<any>('https://csc.iocore.tv:3000/offices/pricing').subscribe(data => {
    this.pricing = data.pricing[0];
    this.retainer = this.pricing.serviceRetainer;

});
    // FORMGROUP1 = PRIMARY MEMBER INFORMATION
    this.formGroup1 = this.formBuilder.group({
      companyName: ['', [Validators.required]],
      membertype   : ['individual', [Validators.required]],
      billingAddress   : ['current address', [Validators.required]],
      selectedCountry : ['', [Validators.required]],
      address: ['', [Validators.required]],
      address2: [''],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      state: ['', [Validators.required]],
      primaryContact: ['', [Validators.required]],
      primaryEmail: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      primaryPhone: ['', [Validators.required]],
      primaryMember: ['', [Validators.required]],
      primaryMemberEmail: ['', [Validators.required, Validators.pattern(this.emailPattern)], this.validateEmailNotTaken.bind(this)],
      primaryMemberPhone: ['', [Validators.required]],
      primaryMemberCheckbox: [''],
      primaryMemberSubscription: [null],
      startDate: ['', [Validators.required]],
      renewalDate: ['']

  });
    // TREAT ALL RELEVANT FIELDS WITH VALIDATION FUNCTIONS
    this.formGroup1.get('primaryEmail').valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.cleanWhiteSpaces(this.formGroup1.get('primaryEmail'));

  });
    this.formGroup1.get('primaryMemberEmail').valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {

    this.cleanWhiteSpaces(this.formGroup1.get('primaryMemberEmail'));
  });

    this.formGroup1.get('companyName').disable();
  // tslint:disable-next-line: align
  this.formGroup1.get('membertype').valueChanges.subscribe((membertype) => {
    this.formGroup1.get('companyName').disable();
    if (membertype === 'company') {
         this.formGroup1.get('companyName').enable();
    }
});

    this.formGroup1.get('state').disable();
  // tslint:disable-next-line: align
  this.formGroup1.get('selectedCountry').valueChanges.subscribe((country) => {
    this.formGroup1.get('state').disable();
    if ((country.toUpperCase() === 'US') || (country.toUpperCase() === 'CA')) {
        this.formGroup1.get('state').enable();
    }
  });
    this.formGroup1.get('selectedCountry').setValue(this.country[0].substr(0, 2));

    this.formGroup1.get('startDate').valueChanges.subscribe((startDate) => {

      if (this.isDate(startDate)) {
        const rDate = new Date(Date.parse(startDate));
        const nDate = rDate.setDate(rDate.getDate() + 365 );

        this.formGroup1.get('renewalDate').setValue(formatDate(nDate, 'MM/dd/yyyy', 'en-US'));
      }
  });
    // SET FORMGROUP 2
    this.formGroup2 = this.formBuilder.group({
      addtlMembers: this.newMembers

    });
   // SET FORMGROUP 3
    this.formGroup3 = this.formBuilder.group({
      offices: this.newOffices
    });
    // SET FORMGROUP4
    this.formGroup4 = this.formBuilder.group({
      addtlParking: [0, ],
      mailService   : [false, ],
    });
    this.formGroup4.get('addtlParking').valueChanges
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe(() => {
        if (this.formGroup4.get('addtlParking').value > this.memberTotal()){
          this.formGroup4.get('addtlParking').setValue(this.memberTotal());
        }
        if (this.formGroup4.get('addtlParking').value < 0){
          this.formGroup4.get('addtlParking').setValue(0);
        }

    });
    // SET FORMGROUP 5
    this.formGroup5 = this.formBuilder.group({
      acceptTerms: [false, [Validators.required]],
      promocode: [null]

    });
    // SET FORMGROUP 6
    this.formGroup6 = this.formBuilder.group({
      directSignup: [false],
      acceptTerms2: [false],
      ccName: ['', [Validators.required]],
      ccAddress: ['', [Validators.required]],
      ccCity: ['', [Validators.required]],
      ccState: ['', [Validators.required]],
      ccZip: ['', [Validators.required]],
      ccCountry: ['', [Validators.required]],
      ccNumber: ['', [Validators.required, Validators.minLength(12), CreditCardValidators.validateCCNumber as any]],
      ccExp: ['', [CreditCardValidators.validateExpDate as any]],
      cvc: ['', [Validators.required as any, Validators.minLength(3) as any, Validators.maxLength(4) as any]]

    });
  }

  dateFilter = date => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  }

ngAfterViewInit(): void{
  // NOT USED
}


// COPY FIELDS FROM SIGNUP PRIMARY CONTACT INTO PRIMARY MEMBER
fillPrimaryMember(): void{

  if (!this.formGroup1.get('primaryMemberCheckbox').value){
    this.formGroup1.get('primaryMember').setValue(this.formGroup1.get('primaryContact').value);
    this.formGroup1.get('primaryMemberEmail').setValue(this.formGroup1.get('primaryEmail').value);
    this.formGroup1.get('primaryMemberPhone').setValue(this.formGroup1.get('primaryPhone').value);
    this.formGroup1.get('primaryMemberEmail').updateValueAndValidity();
  }
  this.formGroup1.get('primaryMemberEmail').markAsTouched();
}



// ADD AN ADDITIONAL MEMBER INTO THE FORM GROUP
addAdditionalMembers(): void{
  this.totalMembers++;
  (this.formGroup2.get('addtlMembers') as FormArray).push(
    new FormGroup({
      id: new FormControl((this.formGroup2.get('addtlMembers') as FormArray).length),
      membername: new FormControl(null, Validators.required),
      // tslint:disable-next-line:max-line-length
      memberemail: new FormControl(null, [Validators.required, Validators.pattern(this.emailPattern)], this.validateEmailNotTaken.bind(this)),
      memberphone: new FormControl(null, Validators.required),
      subscription: new FormControl(null)

    })
  );

  // UPDATE THE MEMBERS LIST IF CHANGED
  this.updateMembers();
  this.formGroup2.get('addtlMembers').valueChanges
  .pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
    const myMemberEmail = this.formGroup2.get('addtlMembers').value;
    let changed = false;
    for (const member of myMemberEmail){
      if (member.memberemail){
        while (member.memberemail.toString().substr(0, 1 ) === ' '){
          member.memberemail = member.memberemail.toString().substr(1);
          changed = true;
        }
        while (member.memberemail.toString().substr(-1, 1 ) === ' '){
          member.memberemail = member.memberemail.toString().substr(0, member.memberemail.toString().length - 1 );
          changed = true;
        }
      }

    }
    if (changed){
     this.formGroup2.get('addtlMembers').setValue(myMemberEmail);
   }
  });
}


// REMOVE A PERTICULAR MEMBER FROM LIST
removeAdditionalMember(i): void {
  this.totalMembers--;
  (this.formGroup2.get('addtlMembers') as FormArray).removeAt(i);
  this.updateMembers();
}




// NOT USED
// tslint:disable-next-line:typedef
onBlurMethod(el){

}


// CHECK IF ENTERED VALUE IS A DATE
isDate(s): boolean {
  const check = Date.parse(s);

  if (isNaN(check)){
    return false;
  } else {
    return true;
  }
}


// CHECK IF MORE THAN 1 MEMBER SIGNED UP
getNoun(): string{
  if (this.totalMembers === 1){
    return 'I';
  } else {
    return 'we';
  }
}


// ADD OPENSPACESUBSCRIPTION
addOpenspace(): void{

  this.addingSubscription = true;
  this.showOpenspace = true;
  this.updateMembers();

}

// ADD DEDICATED DESK SUBSCRIPTION
addDedicated(): void{

  this.addingSubscription = true;
  this.showDedicated = true;
  this.updateMembers();

}

// ADD OFFICESUBSCRIPTION
addOffice(): void{

  this.addingSubscription = true;
  this.showOffice = true;
  this.updateMembers();

}


// TRIM SPACES
cleanWhiteSpaces(formElement): void{

  while (formElement.value.toString().substr(0, 1 ) === ' '){
    formElement.setValue(formElement.value.toString().substr(1));
  }
  while (formElement.value.toString().substr(-1, 1 ) === ' '){
    formElement.setValue(formElement.value.toString().substr(0, formElement.value.toString().length - 1 ));
  }
}


// SUBSCRIPE TO AN OFFICE
// tslint:disable-next-line:variable-name
subscribeOffice(number: string): void{
  this.officeAdded = true;
  const office = this.confRooms.filter((item): boolean => {
    return item.number === number;
  })[0];
  office.free = false;
  this.officeSubscriptions.push({number, id: office._id, term: 1, members: []});

  (this.formGroup3.get('offices') as FormArray).push(
      new FormGroup({
        _id: new FormControl((this.formGroup3.get('offices') as FormArray).length),
        number: new FormControl(number, Validators.required),
        id: new FormControl(office._id, Validators.required),
        term: new FormControl(0, Validators.required),
        members: new FormControl(null)

      })
    );
}


// UPDATE SUBSCRIPTION AFTER CHANGE
updateSubscriptions(myArray, members, abo): void{

  for (const myMember of myArray){
      if (myMember.id === -1){
        this.formGroup1.get('primaryMemberSubscription').setValue(abo);
      } else {
        this.formGroup2.get('addtlMembers').value[myMember.id].subscription = abo;

  }
      // tslint:disable-next-line:no-shadowed-variable
      for (const myMember of members){
    if (myMember.id === -1){
      this.formGroup1.get('primaryMemberSubscription').setValue(null);
    } else {
      this.formGroup2.get('addtlMembers').value[myMember.id].subscription = null;
    }
  }
      if (members.length === 0){
    this.showSubscriptions = false;
  } else {
    this.showSubscriptions = true;
  }
  }
}
 // UPDATE MEMBERS AFTER CHANGE
  updateMembers(): void{

  this.members = [];
  if (!this.formGroup1.get('primaryMemberSubscription').value) {
    // tslint:disable-next-line:max-line-length
    this.members.push({id: -1, membername: this.formGroup1.get('primaryMember').value, memberemail: this.formGroup1.get('primaryMemberEmail').value, memberphone: this.formGroup1.get('primaryMemberPhone').value, subscription: this.formGroup1.get('primaryMemberSubscription').value});
  }

  for (const member of this.formGroup2.get('addtlMembers').value){
    if (!member.subscription){
      this.members.push(member);
    }

  }
  this.openspaceSubscriptions = [];
  this.dedicatedSubscriptions = [];
  if (this.formGroup1.get('primaryMemberSubscription').value === 'openspace'){
    this.openspaceSubscriptions.push({id: -1, membername: this.formGroup1.get('primaryMember').value, memberemail: this.formGroup1.get('primaryMemberEmail').value, memberphone: this.formGroup1.get('primaryMemberPhone').value, subscription: 'openspace'});
  } else if (this.formGroup1.get('primaryMemberSubscription').value === 'dedicated'){
    this.dedicatedSubscriptions.push({id: -1, membername: this.formGroup1.get('primaryMember').value, memberemail: this.formGroup1.get('primaryMemberEmail').value, memberphone: this.formGroup1.get('primaryMemberPhone').value, subscription: 'dedicated'});
  }
  for (const member of this.formGroup2.get('addtlMembers').value){


    if (member.subscription === 'openspace'){
      this.openspaceSubscriptions.push(member);
    } else if (member.subscription === 'dedicated'){
      this.dedicatedSubscriptions.push(member);
    }

  }

}

// DELETE OPENSPACE AFTER CHANGE
removeOpenspace(): void {
  this.openspaceSubscriptions = [];
  if (this.formGroup1.get('primaryMemberSubscription').value === 'openspace'){
    this.formGroup1.get('primaryMemberSubscription').setValue(null);
  }
  for (const member of this.formGroup2.get('addtlMembers').value){

    if (member.subscription === 'openspace'){
      member.subscription = null;
    }

  }
  this.showOpenspace = false;


  this.showSubscriptions = true;
  this.updateMembers();
  // tslint:disable-next-line:max-line-length
  if ((this.openspaceSubscriptions.length === 0) && (this.dedicatedSubscriptions.length === 0) && (this.officeSubscriptions.length === 0) && !this.showDedicated && ! this.showOpenspace && ! this.showOffice){
    this.addingSubscription = false;
  }
}


// DELETE DEDICATED DESK AFTER CHANGE
removeDedicated(): void{
  this.dedicatedSubscriptions = [];
  if (this.formGroup1.get('primaryMemberSubscription').value === 'dedicated'){
    this.formGroup1.get('primaryMemberSubscription').setValue(null);
  }
  for (const member of this.formGroup2.get('addtlMembers').value){

    if (member.subscription === 'dedicated'){
      member.subscription = null;
    }

  }
  this.showDedicated = false;
  this.showSubscriptions = true;
  this.updateMembers();
  // tslint:disable-next-line:max-line-length
  if ((this.openspaceSubscriptions.length === 0) && (this.dedicatedSubscriptions.length === 0) && (this.officeSubscriptions.length === 0) && !this.showDedicated && ! this.showOpenspace && ! this.showOffice){
    this.addingSubscription = false;
  }
}


// DELETE OFFICE AFTER CHANGE
removeOffice(i: number= -1): void{
 if (i === -1){
    for (let a = 0; a < (this.formGroup3.get('offices') as FormArray).length; a++){
      const oF = this.formGroup3.get('offices').value[a];
      const office = this.confRooms.filter((item): boolean => {
        return item.number === oF.number;
      })[0];
      office.free = true;

    }
    while ((this.formGroup3.get('offices') as FormArray).length !== 0) {
      (this.formGroup3.get('offices') as FormArray).removeAt(0);
    }

    this.officeSubscriptions = [];
    this.showOffice = false;

    // tslint:disable-next-line:max-line-length
    if ((this.openspaceSubscriptions.length === 0) && (this.dedicatedSubscriptions.length === 0) && (this.officeSubscriptions.length === 0) && !this.showDedicated && ! this.showOpenspace && ! this.showOffice){
      this.addingSubscription = false;
    }
    if (this.formGroup1.get('primaryMemberSubscription').value && this.formGroup1.get('primaryMemberSubscription').value.substr(0, 6) === 'office'){
      this.formGroup1.get('primaryMemberSubscription').setValue(null);
    }
 } else {
  const oF = this.formGroup3.get('offices').value[i];
  const office = this.confRooms.filter((item): boolean => {
    return item.number === oF.number;
  })[0];
  office.free = true;
  (this.formGroup3.get('offices') as FormArray).removeAt(i);
  if (this.formGroup1.get('primaryMemberSubscription').value === 'office_' + i){
    this.formGroup1.get('primaryMemberSubscription').setValue(null);
  }
  for (const member of this.formGroup2.get('addtlMembers').value){

      if (member.subscription === 'office_' + i){
        member.subscription = null;
      }

    }


  this.officeSubscriptions.splice(i, 1);
  // tslint:disable-next-line:max-line-length
  if ((this.openspaceSubscriptions.length === 0) && (this.dedicatedSubscriptions.length === 0) && (this.officeSubscriptions.length === 0) && !this.showDedicated && ! this.showOpenspace && ! this.showOffice){
    this.addingSubscription = false;
  }
 }
 this.showSubscriptions = true;
 this.updateMembers();

}


// SHOW POPOVER ON SCREEN WHEN CHOSING AN OFFICE
showPopover(id: string): void{
  const office = this.confRooms.filter((item): boolean => {
    return item.number === id;
  })[0];
  this.popoverMessage = '';
  this.popupRoomNumber = id;
  this.popupCapacity = office.capacity.toString();
  this.popupFloor = office.floor.toString();
  this.popupSqft = office.sqft.toString();
  this.popupDescription = office.description;
  this.popupPrice = office.pricing[0].price.toString();
  this.popupAvailability = office.free;
  this.popupPhoto = office.photo;

}

// CLOSE IT... ;=)
closePopover(id: number): void {

  // Incorect because _results is private.
  /*
   this.trigger._results[id].togglePopover();
   */

  this.trigger.togglePopover();

}


// UNLOAD POPOVER FROM SCREEN
onSubmit(id: number): void {
  this.closePopover(id);
}


// HUMAN READABLE FLOOR NUMBER
orderNumber(floor): string{
  // tslint:disable-next-line:radix
  const val = parseInt(floor);
  if (val === 1) {
    return '1st';
  } else if (val === 2) {
    return '2nd';
  } else if (val === 3) {
    return '3rd';
  } else {
    return floor + 'th';
  }
}


// CHECK OFFICE AVAILABILITY
isAvailable(room): boolean{
  const office = this.confRooms.filter((item): boolean => {
    return item.number === room;
  })[0];
  if (office){
    return office.free ;
  }
  return false;
}



// LOAD OFFICE DETAIL
// tslint:disable-next-line:variable-name
getDetail(number: string, type: string): string{
  const office = this.confRooms.filter((item): boolean => {
    return item.number === number;
  })[0];
  switch (type){
    case 'floor':
      return this.orderNumber(office.floor);
      break;
    case 'picture':
      return office.photo;
      break;
    case 'capacity':
      return office.capacity.toString();
      break;
    case 'pricing':
      return office.pricing;
      break;
    case 'defaultPrice':
      return office.pricing[0].price;
      break;
  }
}


// UPDATE OFFICE PRICE
setShowPrice(room: string, i: number, a: number): void {
  const office = this.confRooms.filter((item): boolean => {
    return item.number === room;
  })[0];
  this.showPrice[i] = office.pricing[a].price;
}


// CHECK IF ALL MEMEBRS HAVE BEEN ASSIGNED TO EITHER AN OFFICE, OPENSPACE OR DEDICATE DESK
memberlistIncomplet(): boolean{
  let incomplete = false;
  if (this.showOpenspace && (this.openspaceSubscriptions.length === 0)){
    incomplete = true;
  }
  if (this.showDedicated && (this.dedicatedSubscriptions.length === 0)){
    incomplete = true;
  }
  for (const subs of this.officeSubscriptions){
    if (this.showOffice && (subs.members.length === 0)){
      incomplete = true;
    }
  }
  if (this.showOffice && (this.officeSubscriptions.length === 0)){
    incomplete = true;
  }

  return incomplete;

}


// CHECK MAX NUMBER OF PARKINGS THAT COULD BE BOOKED
memberTotal(): number{

  let maxParkings = ((this.formGroup2.get('addtlMembers') as FormArray).length + 1);
  if (this.officeSubscriptions.length > 0){
    maxParkings -= this.officeSubscriptions.length;
  }
  return maxParkings;
}


// CALCULATE PRICE OF ADDITIONAL PARKING SPOTS
recalcAdServ(): void{

  if (this.formGroup4.get('addtlParking').value > this.memberTotal()){
    this.formGroup4.get('addtlParking').setValue(this.memberTotal());
  }
  if (this.formGroup4.get('addtlParking').value < 0){
    this.formGroup4.get('addtlParking').setValue(0);
  }
  let amount = 0;
  if (this.formGroup4.get('mailService').value){
    amount += this.pricing.mailService;
  }
  amount += (this.formGroup4.get('addtlParking').value * this.pricing.parking);
  this.totalAdServ = amount;

}


// FORMAT OUTPUT FOR TOTAL OF MEMBERSHIPS
printNumberOfMemberships(): string{
  const unitPrice = this.officeSubscriptions.length === 0 ? this.pricing.generalMembership : this.pricing.officeMembership;
  const mult = this.formGroup2.get('addtlMembers').value.length > 0 ? 's' : '';
  // tslint:disable-next-line:max-line-length
  const print = this.formGroup1.get('company') ? ' Corporate membership' + mult + ' for $' + unitPrice + '/year' : ' General membership' + mult + ' for $' + unitPrice + '/year';
  return (this.formGroup2.get('addtlMembers').value.length + 1).toString() + print;
}


// CALC SUM OF ALL MEMBERSHIPS
printMembershipPrice(): number{
  const unitPrice = this.officeSubscriptions.length === 0 ? this.pricing.generalMembership : this.pricing.officeMembership;
  return ((this.formGroup2.get('addtlMembers').value.length + 1) * unitPrice);
}

// FORMAT OUTPUT FOR OPENSPACE SUBSCRIPTIONS
printNumberOfOpenspace(): string{
  const unitPrice = this.pricing.openspace;
  const mult = this.formGroup2.get('addtlMembers').value.length > 0 ? 's' : '';
  const print = ' Open space subscription' + mult + ' for $' + unitPrice + '/month';
  return (this.openspaceSubscriptions.length).toString() + print;
}

// CALC PRICE FOR OPENSPACE SUBSCRIPTIONS
printOpenspacePrice(): string{
  const unitPrice = this.pricing.openspace;
  return ((this.openspaceSubscriptions.length) * unitPrice).toString();
}

// FORMAT NUMBER OF DEDICATED DESK SUBSCRIPTIONS
printNumberOfDedicated(): string{
  const unitPrice = this.pricing.dedicated;
  const mult = this.formGroup2.get('addtlMembers').value.length > 0 ? 's' : '';
  const print = ' Reserved desk subscription' + mult + ' for $' + unitPrice + '/month';
  return (this.dedicatedSubscriptions.length).toString() + print;
}

// CALC PRICDE FOR DEDICATED DESK SCUBSCRIPTIONS
printDedicatedPrice(): string{
  const unitPrice = this.pricing.dedicated;
  return ((this.dedicatedSubscriptions.length) * unitPrice).toString();
}

// FORMAT OUTPUT FOR SELECTED OFFICE DETAILS
printOfficeDetail(room: any): string{
  const office = this.confRooms.filter((item): boolean => {
    return item.number === room.controls.number.value;
  })[0];
  // tslint:disable-next-line:max-line-length
  return '1 Office space #' + office.number + ' - capacity: ' + office.capacity + 'p (' + office.pricing[room.controls.term.value].engagement + ' engagement)';
  }



// RETURN PRICE FOR SELECTED OFFICE
printOfficePrice(room: any): number{
  const office = this.confRooms.filter((item): boolean => {
    return item.number === room.controls.number.value;
  })[0];

  return  office.pricing[room.controls.term.value].price;

}


// FORMAT OUTPUT FOR ADDITIONAL PASRKING SPOTS
printParking(): string{
  const number = this.formGroup4.get('addtlParking').value;
  const mult = number > 1 ? 's' : '';
  return number +  ' Additional parking spot' + mult + ' ($' + this.pricing.parking + '/month)';
}


// CALC TOTAL FOR PARKING
printParkingPrice(): number{
  const number = this.formGroup4.get('addtlParking').value;
  return number * this.pricing.parking;
}


// CALC TOTAL MONTHLY FEE
monthlyFee(): number{
  const openspace = this.openspaceSubscriptions.length;
  const dedicated = this.dedicatedSubscriptions.length;
  const parking = this.formGroup4.get('addtlParking').value * this.pricing.parking;
  const mail = this.formGroup4.get('mailService').value ? this.pricing.mailService : 0;
  let offices = 0;
  for (const office of (this.formGroup3.get('offices') as FormArray).value){
    const id = this.confRooms.filter((item): boolean => {

      return item.number === office.number;
    })[0];

    offices += id.pricing[office.term].price;
  }
  return (openspace * this.pricing.openspace) + (dedicated * this.pricing.dedicated) + offices + parking + mail;
}



// CALC TOTAL SERVIE RETAINER
getServiceRetainer(): number{
  let offices = 0;
  for (const office of (this.formGroup3.get('offices') as FormArray).value){
    const id = this.confRooms.filter((item): boolean => {

      return item.number === office.number;
    })[0];

    offices += (id.pricing[office.term].price * this.retainer);
  }
  return offices;
}


// CALC TOTAL INVOICED AT SIGNATURE
getTotalBillable(): number{
return this.printMembershipPrice() + this.monthlyFee() + this.getServiceRetainer();
}


// CHECK IF TERMS HAVE BEEN ACCEPTED
acceptTerms(): boolean{
  // tslint:disable-next-line:max-line-length
  return !this.formGroup5.get('acceptTerms').value && this.formGroup1.valid && this.formGroup2.valid && this.formGroup3.valid && this.formGroup4.valid;
}

// CALCULATE PERCENTAGE OF REDUCTION
showReduction(eng, a): string{
  const price = eng[a].price;
  const base = eng[0].price;
  const percent = (base - price) / base * 100;
  if (percent > 0){
    return '( -' + percent + '% )';
  } else {
    return  '';
  }

}


// FORMAT OUTPUT TO US PHONE NUMBER
formatUsPhone(phone: string): string{
if ((this.formGroup1.get('selectedCountry').value === 'US') || (this.formGroup1.get('selectedCountry').value === 'CA')){
  phone = '+1 (' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6);
}
return phone;
}


// SAME BUT FOR ARRAY
formatUsPhoneArray(phone: Array<any>): any[]{
  if ((this.formGroup1.get('selectedCountry').value === 'US') || (this.formGroup1.get('selectedCountry').value === 'CA')){
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < phone.length; i++){
      // tslint:disable-next-line:max-line-length
      phone[i].memberphone = '+1 (' + phone[i].memberphone.substr(0, 3) + ') ' + phone[i].memberphone.substr(3, 3) + '-' + phone[i].memberphone.substr(6);
    }
  }
  return phone;
  }


// SUBMIT SUBSCRIPTION WITHOUT GOING THROUGH DOCUSIGN (ANYTHING BUT OFFICESUBSCRIPTION)
quickMember(): void{

  this.submittingForm = true;
  const subscription = {
    type: this.formGroup1.get('membertype').value,
    companyName: this.formGroup1.get('companyName').value,
    billingAddress: this.formGroup1.get('billingAddress').value,
    selectedCountry : this.formGroup1.get('selectedCountry').value,
    address: this.formGroup1.get('address').value,
    address2: this.formGroup1.get('address2').value,
    city: this.formGroup1.get('city').value,
    zip: this.formGroup1.get('zip').value,
    state: this.formGroup1.get('state').value,
    primaryContact: this.formGroup1.get('primaryContact').value,
    primaryEmail: this.formGroup1.get('primaryEmail').value,
    primaryPhone: this.formatUsPhone(this.formGroup1.get('primaryPhone').value),
    primaryMember: this.formGroup1.get('primaryMember').value,
    primaryMemberEmail: this.formGroup1.get('primaryMemberEmail').value,
    primaryMemberPhone: this.formatUsPhone(this.formGroup1.get('primaryMemberPhone').value),
    primaryMemberCheckbox: this.formGroup1.get('primaryMemberCheckbox').value,
    primaryMemberSubscription: this.formGroup1.get('primaryMemberSubscription').value,
    startDate: this.formGroup1.get('startDate').value,
    renewalDate: this.formGroup1.get('renewalDate').value,
    addtlMembers: this.formatUsPhoneArray(this.formGroup2.get('addtlMembers').value),
    offices: this.formGroup3.get('offices').value,
    addtlParking: this.formGroup4.get('addtlParking').value,
    mailService: this.formGroup4.get('mailService').value,
    specialPrice: this.promoCode,
    creditCardToken: this.creditCardToken,
    creditCardNumber: this.creditCardNumber,
    directSubscription: true
  };

  // API CALL:
  this.http.post<any>('https://csc.iocore.tv:3000/offices/fullsubscription', subscription).subscribe(data => {
    const dialogRef = this.dialog.open(DialogComponent, {data: {
      message: 'Thank you for your subscription. We will send you the login information to our members portal by email.',
      class: 'info'
    }});
    dialogRef.afterClosed().subscribe(result => {
      this.document.location.href = 'https://members.cscstation.com/loginnew';
      });

}, error => {
  alert('Could not subscribe at this moment. please try again later.');
  this.submittingForm = false;

});
}


// SUBMIT OFFICE SUBSCRIPTION
submitForm(): void{
  this.submittingForm = true;
  const subscription = {
    type: this.formGroup1.get('membertype').value,
    companyName: this.formGroup1.get('companyName').value,
    billingAddress: this.formGroup1.get('billingAddress').value,
    selectedCountry : this.formGroup1.get('selectedCountry').value,
    address: this.formGroup1.get('address').value,
    address2: this.formGroup1.get('address2').value,
    city: this.formGroup1.get('city').value,
    zip: this.formGroup1.get('zip').value,
    state: this.formGroup1.get('state').value,
    primaryContact: this.formGroup1.get('primaryContact').value,
    primaryEmail: this.formGroup1.get('primaryEmail').value,
    primaryPhone: this.formatUsPhone(this.formGroup1.get('primaryPhone').value),
    primaryMember: this.formGroup1.get('primaryMember').value,
    primaryMemberEmail: this.formGroup1.get('primaryMemberEmail').value,
    primaryMemberPhone: this.formatUsPhone(this.formGroup1.get('primaryMemberPhone').value),
    primaryMemberCheckbox: this.formGroup1.get('primaryMemberCheckbox').value,
    primaryMemberSubscription: this.formGroup1.get('primaryMemberSubscription').value,
    startDate: this.formGroup1.get('startDate').value,
    renewalDate: this.formGroup1.get('renewalDate').value,
    addtlMembers: this.formatUsPhoneArray(this.formGroup2.get('addtlMembers').value),
    offices: this.formGroup3.get('offices').value,
    addtlParking: this.formGroup4.get('addtlParking').value,
    mailService: this.formGroup4.get('mailService').value,
    specialPrice: this.promoCode
  };


// API CALL
  this.http.post<any>('https://csc.iocore.tv:3000/offices/subscription', subscription).subscribe(data => {
    const dialogRef = this.dialog.open(DialogComponent, {data: {
      message: 'Thank you for your subscription. We will contact you soon with a link to DocuSign the membership contract.',
      class: 'info'
    }});
    dialogRef.afterClosed().subscribe(result => {
      this.document.location.href = 'https://www.cscstation.com';
      });

}, error => {
  alert('Could not subscribe at this moment. please try again later.');
  this.submittingForm = false;

});
}


// API CALL TO CHECK IF PROMOCODE IS VALID
promoCodeEnter(): void{
  this.http.post<any>('https://csc.iocore.tv:3000/offices/promo', {promo: this.formGroup5.get('promocode').value}).subscribe(data => {
    this.promoCode = data.promo;
}, error => {
  alert('This promo code has not been found.');
  this.formGroup5.get('promocode').setValue('');

});
}


// REDIRECT TO MEMBERS PORTAL
gotoHomepage(): void{
  this.router.navigate(['home']);
}



// CHECK IF EMAIL IS NOT YET IN THE SYSTEM
validateEmailNotTaken(control: AbstractControl): Observable<any> {
  return this.http.post<any>('https://csc.iocore.tv:3000/offices/emailavailable',
  {email: control.value}, {observe: 'response'}).pipe(
    map((res) => {

        const avail = res.body.email;

        return avail.length > 0 ?  null : { inuse: true } ;

}),

catchError((error) => {
    return error;
}
)

  );
}
}






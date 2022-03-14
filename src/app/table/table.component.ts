import { Component, OnInit, Input } from '@angular/core';
import { Product } from '../models/products';
import { ProductService } from '../services/productservice';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { TableRow } from '../models/tablerow';
import { ItemEdit } from '../models/itemedit';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styles: [`
        :host ::ng-deep .p-dialog .product-image {
            width: 150px;
            margin: 0 auto 2rem auto;
            display: block;
        }
    `],
  styleUrls: ['./table.component.scss']
})




export class TableComponent implements OnInit {
  productDialog: boolean;

  products: any[];

  product: any;

  selectedProducts: Product[];

  submitted: boolean;
  paginator = false;
  rows = 10;
  globalfilterfields = [];
  showcheckbox: boolean;
  showsearch: boolean;
  showeditbutton: boolean;
  shownewbutton: boolean;
  showdeletebutton: boolean;
  nameofentries: string;
  dialogwidth: {};
  dialogheader = '';
  statuses = [{value: '1', label: 'eins'}, {value: '2', label: 'zwei'}];

  // testDescription=' <div class="p-field"><label for="description">Description</label> <textarea id="description" pInputTextarea [(ngModel)]="product.description" required rows="3" cols="20"></textarea></div>';
  itemedit: ItemEdit[];
  tablerows: TableRow[];

  @Input() public showPages: boolean;
  @Input() public showCheckbox: boolean;
  @Input() public showSearch: boolean;
  @Input() public showEditButton: boolean;
  @Input() public showNewButton: boolean;
  @Input() public showDeleteButton: boolean;
  @Input() public maxRows: number;
  @Input() public filterFields: string[];
  @Input() public tableRows: TableRow[];
  @Input() public nameOfEntries: string;
  @Input() public dataStream: any[];
  @Input() public dialogWidth: {};
  @Input() public dialogHeader: string;
  @Input() public itemEdit: ItemEdit[];
  @Input() public parentFunc: Function;
  // tslint:disable-next-line:max-line-length
  constructor(
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
    ) { }

  ngOnInit(): void {
      this.paginator = this.showPages ? this.showPages : false;
      this.rows = this.maxRows ? this.maxRows : 10;
      for (const filt of this.filterFields){
        this.globalfilterfields.push(filt);
      }
      this.showcheckbox = this.showCheckbox;
      this.tablerows = this.tableRows;
      this.showeditbutton = this.showEditButton;
      this.showsearch = this.showSearch;
      this.showdeletebutton = this.showDeleteButton;
      this.shownewbutton = this.showNewButton;
      this.nameofentries = this.nameOfEntries;
      this.products = this.dataStream;
      this.dialogwidth = this.dialogWidth;
      this.dialogheader = this.dialogHeader;
      this.itemedit = this.itemEdit;
      // this.productService.getProducts().then(data => this.products = data);
  }
  ngOnChanges() {
    // create header using child_id
    // console.log(this.dataStream);
    this.products = this.dataStream;
  }
  openNew(): void {
      this.product = {};
      this.submitted = false;
      this.productDialog = true;
  }

  deleteSelectedProducts(): void {
    // console.log(this.selectedProducts);
    this.confirmationService.confirm({

          message: 'Are you sure you want to delete the selected ' + this.nameofentries + '?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
              const deleter: string[] = [];
              for (const delpro of this.selectedProducts){
                deleter.push(delpro.id);
              }
              this.parentFunc('delete', deleter);
              this.selectedProducts.splice(0,this.selectedProducts.length);
          }
      });
  }

  editProduct(product: Product) {
      this.product = {...product};
      this.productDialog = true;
  }

  deleteProduct(product: Product) {
      // alert(JSON.stringify(product));
      // this.parentFunc("delete", "Marks");
      this.confirmationService.confirm({
          message: 'Are you sure you want to delete ' + product.name + '?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
          this.parentFunc('delete', product.id);
          }
      });
  }

  hideDialog() {
      this.productDialog = false;
      this.submitted = false;
  }

  saveProduct() {
    this.submitted = true;


    // console.log(this.product);


    if (this.allRequiredFields(this.product, this.itemedit)) {
          if (this.product.id) {

              this.parentFunc('update', this.product);
          }
          else {


              // this.products.push(this.product);
              // this.messageService.add({severity: 'success', summary: 'Successful', detail: 'Product Created', life: 500});
              this.parentFunc('create', this.product);
          }

          this.products = [...this.products];
          this.productDialog = false;
          this.product = {};
      }


  }

  findIndexById(id: string): number {
      let index = -1;
      for (let i = 0; i < this.products.length; i++) {
          if (this.products[i].id === id) {
              index = i;
              break;
          }
      }

      return index;
  }

  createId(): string {
      let id = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for ( let i = 0; i < 5; i++ ) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
  }
  printHeader(header){
    alert();
    return 'pSortableColumn="category"';
  }
  formatRow(row, value){
    let ret = '';
    switch (row.formatting){
      case 'CURRENCY':
        ret = parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 });
        break;
      default:
        ret = value;
    }
    if (row.prefix && row.prefix !== ''){
      ret = row.prefix + ret;
    }
    if (row.suffix && row.suffix !== ''){
      ret += row.suffix;
    }
    return ret;

  }
  getColStyle(header){

    let style = '';
    if (header.align && header.align !== ''){
      style += 'text-align:' + header.align + ';';
    }
    if (header.width && header.width !== ''){
      style += 'width:' + header.width + ';';
    }
    // console.log(style);
    return style;
  }
  allRequiredFields(product, edit){
    // console.log(product);
    // console.log(edit);
    let valid = true;
    for (const line of edit){
      // console.log(product[line.name]);
      if ((line.required && !product[line.name]) || (line.required && (product[line.name].toString().trim() === ''))){
        valid = false;
      }
    }
    return valid;
  }
}

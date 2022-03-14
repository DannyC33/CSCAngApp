export interface ItemEdit {
  name?: string;
  label?: string;
  type?: string;
  required?: boolean;
  rows?: number;
  cols?: number;
  modifiable?:boolean;
  pattern?: {
    mode?: string;
    currency?: string;
    locale?: string;
  };
  select?:
      {
      value?: any;
      label?: string;
    }[];


}

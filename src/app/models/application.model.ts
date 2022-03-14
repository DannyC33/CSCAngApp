export class ApplicationModel {
  constructor(
      public name: string,
      public api_key: string,
      public entity: string,
      public displayname: string,
      public loginUrl: string,
      public authUrl: string,
      public apiUrl: string,
      public confroomUrl: string,
      public menuItems: string[]
  ){}
}

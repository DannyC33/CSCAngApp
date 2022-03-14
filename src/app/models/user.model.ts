export interface User {

      _id: string,
       firstname: string,
       lastname: string,
       email: string,
       entity: string,
       photo: string,
       apps: string[],
       verified: boolean,
       spaces: string[],
       application_rights: number,
       language: string,
       codeSent: string[],
       owner: string,
       billing: string[],
       superAdmin: boolean,
       entityAdmin: boolean

}

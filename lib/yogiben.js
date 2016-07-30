import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';


AdminConfig = {
  collections: {
    Apps: {
      collectionObject: Apps,     
    } ,
    Streams: {
      collectionObject: Streams,     
    },
    Customers: {
      collectionObject: Customers,     
    }
  }
};
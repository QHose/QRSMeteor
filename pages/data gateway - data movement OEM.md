
If you have a mulititenant architecture in which you have a database per customer, we can also move all changes into the cloud
- We will install 1 data gateway on premise
- We create a task per customer to replicate its data to a landing bucket in the  AWS cloud. (other options also possible)
- The data replication will continuously update the files (QVDs) in the data assets bucket. (one QVD per table)
- Your app will reload as normal. This time one if the inputs (data connections) will be a bucket which is populated with fresh data every X minutes.

![image](https://user-images.githubusercontent.com/12411165/197127025-01279f4e-564d-41dc-87d1-9d0d476cbbe1.png)
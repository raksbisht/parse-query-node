# parse-query-node
[![GitHub issues](https://img.shields.io/github/issues/raksbisht/parse-query-node)](https://github.com/raksbisht/parse-query-node/issues)
[![GitHub stars](https://img.shields.io/github/stars/raksbisht/parse-query-node)](https://github.com/raksbisht/parse-query-node/stargazers)
[![GitHub license](https://img.shields.io/github/license/raksbisht/parse-query-node)](https://github.com/raksbisht/parse-query-node/blob/main/LICENSE)


A Parse Platform REST API utility and query builder for the Parse Platform SDK for Node. Simplify and enhance your queries with ease using this powerful query builder, leveraging the Parse Platform REST API.


## Installation
```bash  
npm install parse-query-node
```   
## Usage  
  

```javascript
  
const ParseQuery = require('parse-query-node');  
  
// Example initialization    
const query = new ParseQuery(
    '<Your-Application-Id>',
    '<Your-Master-Key>',
    '<Your-REST-API-Key>',
    '<Your-Parse-Server-URL>',
    '<Your-Parse-Server-Version>'
);
  
// Example usage    
query.table('YourTableName')
    .where('fieldName', '>', 10)
    .with('relatedField')
    .getAll()
    .then(results => {
        console.log(results);
    })
    .catch(error => {
        console.error(error);
    });    
```   
## ParseQuery Documentation
The ParseQuery provides a convenient way to construct queries for Parse Server.


# Usage
## Initialization
Initializes a new ParseQuery object with the specified Parse Server configuration parameters.
```javascript
const ParseQuery = require('parse-query-node');

// Initialize ParseQuery with required parameters
const query = new ParseQuery(
    '<Your-Application-Id>',
    '<Your-Master-Key>',
    '<Your-REST-API-Key>',
    '<Your-Parse-Server-URL>',
    '<Your-Parse-Server-Version>'
);
```


- applicationId: Your Parse application ID.
-  masterKey: Your Parse master key (optional).
-  restApiKey: Your Parse REST API key.
- parseServerUrl: URL of your Parse Server.
- parseServerVersion:Version of your Parse Server.




## Basic Querying

### Create a Table Reference
Specifies the Table Name to query.
 ```javascript 
query.table('<YourTableName>');
``` 
### Basic Where Conditions
Adds basic equality and comparison conditions to the query.
 ```javascript 
query.where('fieldName', '=', 'value')  
      .where('otherField', 10)
      .where({name:"test"})
      .where([['field1', '>', 10], ['field2', '=', 'value']]);
``` 
### Include Related Fields
Includes related fields in the query result.
 ```javascript 
query.with('relatedField1', 'relatedField2');
``` 

## Advanced Querying

#### Joining with Pointer
Adds a condition to join with a Pointer field.
 ```javascript 
query.whereJoinKey('foreignkeyname', 'foreignkeyValue', 'ForeignTableName');
``` 
### In Query
Adds a condition to check if a field matches any value in a subquery.
 ```javascript 
query.whereJoinInQuery('foreignkeyname', [
    ['score', '>', 90],
    ['level', '=', 'advanced'],
], 'ForeignTableName');
``` 
### Not In Query
Adds a condition to check if a field does not match any value in a subquery.
 ```javascript 
query.whereJoinNotInQuery('foreignkeyname', [
    ['score', '>', 90],
    ['level', '=', 'advanced'],
], 'ForeignTableName');
``` 
### Related To
Adds a condition to retrieve objects related to a specific parent object.

#### For example :
Imagine you have a Post class and User class, where each Post can be liked by many users. If the Users that liked a Post were stored in a Relation on the post under the key “likes”, you can find the users that liked a particular post by: 
```javascript
//query.whereRelatedTo('Post', '1', 'likes');
query.whereRelatedTo('ForeignTableName', 'ForeignTableObjectId', 'foreignkeyname'); 
``` 

### Where In
Adds a condition to check if a field matches any value in a given array.
 ```javascript 
query.whereIn('field', [1,3,5,7,9]);
``` 

### Where Not In
Adds a condition to check if a field does not match any value in a given array.
 ```javascript 
query.whereNotIn('field', [1,3,5,7,9]);
``` 

### Where Exists
Adds a condition to check if a field exists.
 ```javascript 
query.whereExists('field');
``` 

### Where Not Exists
Adds a condition to check if a field does not exist.
 ```javascript 
query.whereNotExists('field');
``` 

### Where Contains All
Adds a condition to check if a field contains all specified values.
 ```javascript 
query.whereContainsAll('field', [2,3,4]);
``` 

### Where Contains
Adds a condition to check if a field contains a specific value.
 ```javascript 
query.whereContains('field', 2);
``` 

### Where Full Text Search (Requires Parse-Server 2.5.0+)
Adds a condition for full-text search on a field.
 ```javascript 
query.whereFullText('fieldName', 'searchTerm');
``` 

## Data Manipulation

### Insert Data
Inserts data into the specified Table.
 ```javascript 
query.insert({name: 'Alice', age: 30 });
query.insert([
    { name: 'Alice', age: 30, city: 'San Francisco' },
    { name: 'Bob', age: 28, city: 'Los Angeles' },
]);
``` 

### Update Data
Updates data in the specified Table for a specific object.
 ```javascript 
query.update('objectId', { key: 'updatedValue' });
``` 
### Delete Data
Deletes data from the specified Table for a specific object.
 ```javascript 
query.delete('objectId');
``` 
### Delete Field
Deletes a specific field from an object in the specified Table.
 ```javascript 
query.deleteField('objectId', 'fieldName');
``` 
### Add to Array
Adds values to an array field in an object.
 ```javascript 
query.addToArray('objectId', 'fieldName', ['value1', 'value2']);
``` 
### Add Unique to Array
Adds unique values to an array field in an object.
 ```javascript 
query.addUniqueToArray('objectId', 'fieldName', ['value1', 'value2']);
``` 
### Remove From Array
Removes values from an array field in an object.
 ```javascript 
query.removeFromArray('objectId', 'fieldName', ['value1', 'value2']);
``` 
## Additional Operations

#### Distinct (Requires Parse-Server 2.7.0+)
Retrieves distinct values for specified fields.
 ```javascript 
query.distinct('field1', 'field2');
``` 
### Aggregate (Requires Parse-Server 2.7.0+)
Performs aggregation using a specified pipeline.
 ```javascript 
const exmaplePipeline = [
    {
        $match: {
            field1: { $exists: true },
            field2: { $gte: 0 },
        },
    },
    {
        $group: {
            _id: '$groupField',
            count: { $sum: 1 },
        },
    },
];
query.aggregate(exmaplePipeline);
```
### Count Records
Counts the number of records that match the query.
 ```javascript 
query.count();
``` 
###  First Record
Retrieves the first record that matches the query.
 ```javascript 
query.first();
``` 
### Get All Records
Retrieves all records that match the query.
 ```javascript 
query.getAll();
``` 
### Find Record by ObjectId
Retrieves a specific record by its object ID.
 ```javascript
query.find('objectId');
``` 
## Ordering and Limiting

### Order By
Orders the query result by a specified field in ascending order.
 ```javascript 
query.orderBy('fieldName', 'asc');
query.orderBy('fieldName', 'desc');
``` 
### Order By Descending
Orders the query result by specified fields in descending order.
 ```javascript 
query.orderByDesc('field1', 'field2');
``` 
### Order By Ascending
Orders the query result by specified fields in ascending order.
 ```javascript 
query.orderByAsc('field1', 'field2');
``` 
### Limit Results
Limits the number of results returned by the query.
 ```javascript 
query.limit(10);
``` 
### Skip Results
Skips a specified number of results in the query result set.
 ```javascript 
query.skip(5);
``` 
## Field Selection

### Select Fields
Selects specific fields to be included in the query result.
 ```javascript 
query.select('field1', 'field2');
``` 
### Except Fields
Excludes specific fields from the query result.
 ```javascript 
query.except('field1', 'field2');
``` 
## Execution
### Execute Query
Executes the constructed query and returns the result.
 ```javascript
try {
    const result = await query.execute();
    console.log(result);
} catch (error) {
    console.error(error);
}
```

## License

This package is open-source and available under the MIT License.

## Issues and Contributions

If you encounter any issues or have suggestions for improvements, please feel free to open an issue on the GitHub repository: [Link to GitHub Repository](https://github.com/raksbisht/parse-query-node)

Contributions and pull requests are welcome!

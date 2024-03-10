class ParseQuery {
  constructor(applicationId,masterKey,restApiKey, parseServerUrl, parseServerVersion) {
    this.headers = {
      'X-Parse-Application-Id': applicationId,
      'X-Parse-REST-API-Key': restApiKey,
      'Content-Type': 'application/json',
    };
    if(masterKey){
        this.headers['X-Parse-Master-Key']=masterKey
    }
    this.parseServerUrl = parseServerUrl;
    this.parseServerVersion = parseServerVersion;

    this.className = '';
    this.data = [];
    this.selectFields = [];
    this.exceptFields = [];
    this.whereConditions = [];
    this.includeFields = [];
    this.distinctFields = [];

    this.fullTextSearchField = null;

    this.operators = {
        '<': '$lt',
        '<=': '$lte',
        '>': '$gt',
        '>=': '$gte',
        '!=': '$ne',
        '=': '$eq', // Adding equality operator
        'in': '$in',
        'notIn': '$nin',
        'exists': '$exists', // New operator for exists condition
        'containsAll': '$all',
        'contains':null,
        'like':'$regex'
      };
  }

  table(className) {
    this.className = className;
    return this;
  }


  where(field, operatorOrValue = null, value = null) {
    if (Array.isArray(field)) {
      // If the first argument is an array, assume it's an array of conditions
      field.forEach(condition => {
        const [field, operator, value] = condition;
        this.handleCondition(field, operator, value);
      });
    } else {
      this.handleCondition(field, operatorOrValue, value);
    }

    return this;
  }

  whereJoinKey(fieldName, pointerClassName, pointerObjectId) {
    const foreignKeyCondition = {
      [fieldName]: {
        __type: 'Pointer',
        className: pointerClassName,
        objectId: pointerObjectId,
      },
    };

    this.whereConditions.push(foreignKeyCondition);

    return this;
  }
  whereJoinInQuery(field, conditions,className) {
    const inQuery = this.buildInQuery(conditions);
    const whereConditions = {
      $inQuery: {
        where: inQuery,
        className: className,
      },
    };
    this.handleCondition(field, null, whereConditions);
    return this;
  }
  whereJoinNotInQuery(field, conditions,className) {
    const inQuery = this.buildInQuery(conditions);
    const whereConditions = {
      $notInQuery: {
        where: inQuery,
        className: className,
      },
    };
    this.handleCondition(field, null, whereConditions);
    return this;
  }

  buildInQuery(conditions) {
    return conditions.map(condition => {
        const [field, operator, value] = condition;
        const resolvedOperator = this.operators[operator] || operator;

        if (resolvedOperator && value !== undefined) {
          return { [field]: { [resolvedOperator]: value } };
        } else {
          return { [field]: resolvedOperator };
        }
      });
  }
  whereRelatedTo(parentClassName, parentObjectId, relationKey) {
    const relationQuery = {
      "$relatedTo": {
        "object": {
          "__type": "Pointer",
          "className": parentClassName,
          "objectId": parentObjectId,
        },
        "key": relationKey,
      },
    };
    this.whereConditions.push(relationQuery); // Fix here
    //this.whereConditions = relationQuery;
    return this;
  }

  whereIn(field, values) {
    this.handleCondition(field, 'in', values);
    return this;
  }

  whereNotIn(field, values) {
    this.handleCondition(field, 'notIn', values);
    return this;
  }
  whereExists(field) {
    this.handleCondition(field, 'exists', true);
    return this;
  }
  whereNotExists(field) {
    this.handleCondition(field, 'exists', false);
    return this;
  }
  whereContainsAll(field, values) {
    this.handleCondition(field, 'containsAll', values);
    return this;
  }
  whereContains(field, value) {
    this.handleCondition(field, 'contains', value);
    return this;
  }

  whereFullText(field, searchTerm) {
    if (this.parseServerVersion < '2.5.0') {
        throw new Error('Full-text search is only supported starting with Parse-Server 2.5.0');
      }

      if (!field || typeof field !== 'string') {
        throw new Error('Field must be a non-empty string');
      }

      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Search term must be a non-empty string');
      }
    this.whereConditions[field] = {
      '$text': {
        '$search': {
          '$term': searchTerm,
        },
      },
    };

    return this;
  }


  with(...relationFields) {
    this.includeFields.push(...relationFields);
    return this;
  }

  handleCondition(field, operator, value) {
    // Replace operator if it exists in the operators object
    const resolvedOperator = this.operators[operator] || operator;

    if (typeof field === 'object') {
      Object.entries(field).forEach(([key, val]) => {
        if (typeof val === 'object') {
          if (!this.whereConditions[key]) {
            this.whereConditions[key] = {};
          }
          Object.entries(val).forEach(([op, v]) => {
            this.whereConditions[key][op] = v;
          });
        } else {
          if (!this.whereConditions[key]) {
            this.whereConditions[key] = val;
          }
        }
      });
    } else {
      if (!this.whereConditions[field]) {
        this.whereConditions[field] = {};
      }

      if (resolvedOperator !== null && value !== null) {
        this.whereConditions[field][resolvedOperator] = value;
      } else {
        // Default condition to '=' if only two arguments are provided
        this.whereConditions[field] = resolvedOperator;
      }
    }
  }

  create(data){
   this.insert(data);
  }
  insert(data) {
    if (Array.isArray(data)) {
      this.data = data.map(item => ({
        method: 'POST',
        path: `/parse/classes/${this.className}`,
        body: item,
      }));
    } else {
      this.data = [
        {
          method: 'POST',
          path: `/parse/classes/${this.className}`,
          body: data,
        },
      ];
    }
    return this.execute();
  }
  distinct(...fields) {
    if (this.parseServerVersion < '2.7.0') {
        throw new Error('Distinct is only supported starting with Parse-Server 2.7.0');
      }
    const params = {};

    if (Object.keys(this.whereConditions).length > 0) {
        params.where = JSON.stringify(this.whereConditions);
    }

    params.distinct=fields.join(',');

    this.data = {
      method: 'GET',
      path: `/parse/aggregate/${this.className}`,
      params,
    };

    return this.execute();
  }
  aggregate(pipeline) {
    if (this.parseServerVersion < '2.7.0') {
        throw new Error('Aggregate is only supported starting with Parse-Server 2.7.0');
      }
    this.data = {
      method: 'GET',
      path: `/parse/aggregate/${this.className}`,
      params: {
        ...pipeline,
      },
    };
    return this.execute();
  }
  count() {
    const params = {
      limit: 0,
      count: 1,
    };

    if (Object.keys(this.whereConditions).length > 0) {
        params.where = JSON.stringify(this.whereConditions);
    }

    this.data = {
      method: 'GET',
      path: `/parse/classes/${this.className}`,
      params,
    };

    return this.execute();
  }
  first() {
    // Set the order to retrieve the latest record
    this.orderBy = '-createdAt';

    // Limit the result to one record
    this.limit(1);

    // Finally, execute the query
    return this.getAll();
  }

  getAll() {
    const params = {
      order: this.orderBy,
      limit: this.limitValue,
      skip: this.skipValue,
    };

    if (this.selectFields && this.selectFields.length > 0) {
      params.keys = this.parseServerVersion >= '5.0.0' ? this.selectFields : this.selectFields.join(',');
    }

    if (this.exceptFields && this.exceptFields.length > 0) {
      params.excludeKeys = this.parseServerVersion >= '5.0.0' ? this.exceptFields : this.exceptFields.join(',');
    }
    if (Object.keys(this.whereConditions).length > 0) {

        params.where = JSON.stringify(this.whereConditions);
   }
   if (this.includeFields.length > 0) {
    params.include = this.includeFields.join(',');
  }

    this.data = {
      method: 'GET',
      path: `/parse/classes/${this.className}`,
      params,
    };
    return this.execute();
  }

  find(objectId) {
    const params = {};
    if (this.selectFields && this.selectFields.length > 0) {
      params.keys = this.parseServerVersion >= '5.0.0' ? this.selectFields : this.selectFields.join(',');
    }

    if (this.exceptFields && this.exceptFields.length > 0) {
      params.excludeKeys = this.parseServerVersion >= '5.0.0' ? this.exceptFields : this.exceptFields.join(',');
    }

    this.data = {
      method: 'GET',
      path: `/parse/classes/${this.className}/${objectId}`,
      params,
    };
    return this.execute();
  }


  update(objectId, updateData) {
    this.data = {
      method: 'PUT',
      path: `/parse/classes/${this.className}/${objectId}`,
      body: updateData,
    };
    return this.execute();
  }

  increment(objectId, field, amount = 1) {
    return this.update(objectId, { [field]: { __op: 'Increment', amount } });
  }

  decrement(objectId, field, amount = 1) {
    return this.update(objectId, { [field]: { __op: 'Increment', amount: -amount } });
  }

  delete(objectId) {
    this.data = {
      method: 'DELETE',
      path:`/parse/classes/${this.className}/${objectId}`,

    //  path: objectId ? `/parse/classes/${this.className}/${objectId}` :`/parse/classes/${this.className}`,
    };
    return this.execute();
  }

  deleteField(objectId, field) {
    this.data = {
      method: 'PUT',
      path: `/parse/classes/${this.className}/${objectId}`,
      body: { [field]: { __op: 'Delete' } },
    };
    return this.execute();
  }

  addToArray(objectId, field, objects) {
    return this.updateArray(objectId, field, 'Add', objects);
  }

  addUniqueToArray(objectId, field, objects) {
    return this.updateArray(objectId, field, 'AddUnique', objects);
  }

  removeFromArray(objectId, field, objects) {
    return this.updateArray(objectId, field, 'Remove', objects);
  }

  updateArray(objectId, field, operation, objects) {
    this.data = {
      method: 'PUT',
      path: `/parse/classes/${this.className}/${objectId}`,
      body: { [field]: { __op: operation, objects } },
    };
    return this.execute();
  }
  orderBy(field, order = 'asc') {
    if (this.orderBy) {
      this.orderBy += `,${order === 'desc' ? '-' : ''}${field}`;
    } else {
      this.orderBy = `${order === 'desc' ? '-' : ''}${field}`;
    }
    return this;
  }
  orderByDesc(...fields) {
    this.orderBy = fields.map(field => `-${field}`).join(',');
    return this;
  }

  orderByAsc(...fields) {
    this.orderBy = fields.join(',');
    return this;
  }
  limit(value) {
    this.limitValue = value;
    return this;
  }

  skip(value) {
    this.skipValue = value;
    return this;
  }
  select(...fields) {
    if (this.exceptFields.length > 0) {
        throw new Error('Cannot use both select and except methods simultaneously.');
      }
    this.selectFields = fields;
    return this;
  }

  except(...fields) {
    if (this.selectFields.length > 0) {
        throw new Error('Cannot use both select and except methods simultaneously.');
      }
    this.exceptFields = fields;
    return this;
  }

  validateInitializationParams() {
    if (!this.parseServerUrl || !this.headers['X-Parse-Application-Id'] || !this.headers['X-Parse-REST-API-Key']) {
      throw new Error('Missing required parameters. Please check the ParseQuery initialization.');
    }
  }
  async execute() {
    try {
      this.validateInitializationParams();

      if (Array.isArray(this.data)) {
        const response = await fetch(`${this.parseServerUrl}/parse/batch`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ requests: this.data }),
        });
        const data = await response.json();
        return data;
      } else {
        const response = await fetch(`${this.parseServerUrl}${this.data.path}`, {
          method: this.data.method,
          headers: this.headers,
          body: JSON.stringify(this.data.body),
        });
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error executing query:', error.message);
      throw error;
    }
  }
}

module.exports = ParseQuery;

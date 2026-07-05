export default class APIFeatures {
  constructor(query, queryString, searchFields = []) {
    this.query = query;
    this.queryString = queryString;
    this.searchFields = searchFields;
  }

  filter() {
    const queryObj = { ...this.queryString };
    ['page', 'limit', 'sort', 'fields', 'search'].forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne|in)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search() {
    if (this.queryString.search && this.searchFields.length) {
      const regex = new RegExp(escapeRegex(this.queryString.search), 'i');
      this.query = this.query.find({
        $or: this.searchFields.map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(this.queryString.fields.split(',').join(' '));
    }
    return this;
  }

  paginate() {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 20, 1), 100);
    this.page = page;
    this.limit = limit;
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    return this;
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

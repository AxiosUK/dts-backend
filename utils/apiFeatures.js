export default class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortVal = this.queryString.sort;
      let sortBy = null;
      if (typeof sortVal === "string") {
        sortBy = sortVal.split(",").join(" ");
      } else if (Array.isArray(sortVal)) {
        sortBy = sortVal.join(" ");
      } else {
        try {
          sortBy = String(sortVal).split(",").join(" ");
        } catch (e) {
          sortBy = null;
        }
      }

      if (sortBy) this.query = this.query.sort(sortBy);
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      let fieldsVal = this.queryString.fields;
      let fields = null;
      if (typeof fieldsVal === "string") {
        fields = fieldsVal.split(",").join(" ");
      } else if (Array.isArray(fieldsVal)) {
        fields = fieldsVal.join(" ");
      } else {
        try {
          fields = String(fieldsVal).split(",").join(" ");
        } catch (e) {
          fields = null;
        }
      }

      if (fields) this.query = this.query.select(fields);
      else this.query = this.query.select("-__v");
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    const pageRaw = Array.isArray(this.queryString.page)
      ? this.queryString.page[0]
      : this.queryString.page;
    const limitRaw = Array.isArray(this.queryString.limit)
      ? this.queryString.limit[0]
      : this.queryString.limit;
    const page = pageRaw * 1 || 1;
    const limit = limitRaw * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

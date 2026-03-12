import APIFeatures from "../utils/apiFeatures.js";

class MockQuery {
  constructor() {
    this.operations = [];
  }
  find(obj) {
    this.operations.push({ op: "find", obj });
    return this;
  }
  sort(val) {
    this.operations.push({ op: "sort", val });
    return this;
  }
  select(val) {
    this.operations.push({ op: "select", val });
    return this;
  }
  skip(n) {
    this.operations.push({ op: "skip", n });
    return this;
  }
  limit(n) {
    this.operations.push({ op: "limit", n });
    return this;
  }
}

test("APIFeatures applies filter, sort, fields and pagination", () => {
  const mock = new MockQuery();

  const queryString = {
    sort: "dueDate,-createdAt",
    fields: "title,status",
    page: "2",
    limit: "10",
    // simulate incoming query param for comparison operator
    dueDate: { gte: "2026-01-01" },
  };

  const features = new APIFeatures(mock, queryString)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // After filter() the first operation should be find() with $gte transformed
  const findOp = mock.operations.find((o) => o.op === "find");
  expect(findOp).toBeDefined();
  expect(findOp.obj).toEqual({ dueDate: { $gte: "2026-01-01" } });

  // sort should be converted to space-separated fields
  const sortOp = mock.operations.find((o) => o.op === "sort");
  expect(sortOp).toBeDefined();
  expect(sortOp.val).toBe("dueDate -createdAt");

  // select should include requested fields
  const selectOp = mock.operations.find((o) => o.op === "select");
  expect(selectOp).toBeDefined();
  expect(selectOp.val).toBe("title status");

  // pagination should set skip and limit
  const skipOp = mock.operations.find((o) => o.op === "skip");
  const limitOp = mock.operations.find((o) => o.op === "limit");
  expect(skipOp).toBeDefined();
  expect(limitOp).toBeDefined();
  expect(skipOp.n).toBe(10); // (page 2 -1) * limit 10
  expect(limitOp.n).toBe(10);
});

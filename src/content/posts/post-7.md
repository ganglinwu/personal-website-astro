---
title: "Runtime mocking vs Dependency injection"
date: 2025-07-01T00:00:00Z
categories:
  - TypeScript
  - JavaScript
  - jest
  - vitest
draft: false
---

# **Jest vs Vitest: The King vs New Kid On The Block**

When building modern JavaScript/TypeScript applications, choosing the right testing framework can significantly impact your development experience. After working with both Jest and Vitest, here's what I've learned about their strengths and the powerful world of runtime mocking.

### **Jest: The Veteran Champion**

Jest has been the go-to testing framework for years, particularly excelling in:

- **CommonJS and React ecosystems** - Rock-solid compatibility
- **Mature ecosystem** - Extensive supporting packages and community resources
- **Battle-tested stability** - Years of production use

However, Jest does come with a notable drawback: **speed**. It can be slower, especially with larger codebases.
Not to mention, TypeScript code needs to transpile to JavaScript.

### **Vitest: The Speed Demon**

Vitest emerges as the modern alternative, particularly shining with:

- **ESM and TypeScript** - Native support without configuration headaches
- **Blazing fast execution** - Significantly faster test runs
- **Modern tooling integration** - Built for the Vite ecosystem

### **The Node.js Wild Card**

Since Node 20, there's also `node:test` - Node's built-in testing solution. While still maturing, it's worth considering for simple projects wanting to minimize dependencies.

## **New and Shiny but.. Not All That Glitters Is Gold**

Instead of complex dependency injection patterns, Jest/Vitest embraces **runtime mocking**. Here's a balanced analysis:

### **Runtime Mocking Pros:**

- **Co-location benefit** - Mocking logic lives with the test, making it easier to understand test intent
- **Self-contained tests** - Easier to read and maintain
- **Performance** - Tests run faster (no real dependencies)
- **Deterministic** - Consistent, controllable test conditions
- **Isolation** - Pure unit testing, only tests your code

### **Runtime Mocking Cons:**

- **False confidence** - Unit tests pass easily but integration/e2e tests will be more difficult
- **Mock drift** - Mocks can become stale contracts that don't reflect reality
- **Refactoring blindness** - Changes to interfaces might not break mocked tests
- **Testing strategy issue** - Harder to catch runtime errors when everything is mocked

### **DI Advantages We Shouldn't Ignore:**

- **Contract enforcement** - Interfaces ensure real implementations match expectations (I feel this is a strong point why I still prefer Golang)
- **Refactoring safety** - Interface changes break tests immediately
- **Hybrid testing** - Same test can run with mocks or real implementations

## **Mastering Jest's(or Vitest's) spyOn: Your Mocking Superpower**

Understanding `spyOn` is crucial for effective testing, but before that you need to know what are mock functions.

Here's the crash course:

### **Mock Functions: The Shape-Shifters**

Think of mock functions as the "Ditto" (Pokemon creature) of the programming world - they can morph into any function signature:

```typescript
const mockFoo = jest.fn<typeof Foo>();
// Now mockFoo can be used anywhere Foo is expected

mockFoo.mockImplementation(() => console.log("bar"));
// Instead of complex original logic, do whatever you want
```

### **spyOn: The Method Interceptor**

`spyOn` takes this further by automatically creating mocks for existing methods:

```typescript
const foo = jest.spyOn(MyClass, "methodName");
// foo is now a mock function that intercepts MyClass.methodName()

// Track all calls and results
foo.mock.calls(); // Array of call arguments
foo.mock.results(); // Array of return values
```

### **jest.mock(): The Module Replacer**

While `spyOn` targets specific methods, `jest.mock()` takes a more aggressive approach:

```typescript
jest.mock("path/to/module", mock_implementation_function);
```

**Key differences:**

- **spyOn**: Only changes the specific method you spied on, other methods remain unchanged
- **jest.mock**: Replaces **ALL** exported functions of a module with `jest.fn()`

**vitest.mock() works _almost_ the same, except that it must be declared at top level outside the describe function of the test!**

## **Real-World Applications: Testing Layered Architecture**

### **Scenario 1: Testing Service Layer with spyOn**

Consider a typical **router → service → repository** architecture. To unit test router functions, you need to mock service and repository calls.

**Traditional approach:** Create interfaces and mock instances  
**Modern approach:** Use `spyOn` to intercept specific methods

```typescript
// Instead of complex interface mocking
const serviceSpy = jest.spyOn(catalogService, "createProduct");
serviceSpy.mockResolvedValue(mockProduct);

// Clean, focused, and maintainable
```

### **Scenario 2: Testing Repository Layer with jest.mock()**

For database repositories, we can use `jest.mock()` to replace the entire PrismaClient module:

```typescript
const mockPrismaProduct = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
};

// Mock the entire PrismaClient module
jest.mock("../../generated/prisma", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    product: mockPrismaProduct,
  })),
}));

// Our test assertions focus on calls and arguments
expect(mockPrismaProduct.create).toHaveBeenCalledWith({
  data: productData,
});
```

This saves us from spinning up a database just to test PrismaClient. (Perhaps that's more of kicking the can down the road, since we have to do that eventually in integration tests)

## **Conclusion: The Sweet Spot**

The optimal approach isn't choosing one over the other—it's using both strategically:

- **Runtime mocking** for fast unit tests or for prototyping/proof-of-concept projects.
- **DI** for slower integration tests
- Both approaches serving different purposes in your testing pyramid

For testing strategy, avoid the false dichotomy between runtime mocking and dependency injection. The real power comes from understanding when to use each approach. Runtime mocking excels at fast, isolated unit tests, while DI shines in integration scenarios where contract enforcement matters.

The key is building a comprehensive testing strategy that leverages the strengths of both approaches.

Happy testing! 🧪

---

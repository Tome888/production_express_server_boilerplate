import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Express API",
      version: "1.0.0",
    },
  },
  apis: ["./src/modules/**/*.ts", "./src/routes.ts"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
